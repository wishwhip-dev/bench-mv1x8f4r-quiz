"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScoreChart, type ChartPoint } from "@/components/quiz/score-chart";
import { AttemptsTable } from "@/components/quiz/attempts-table";
import { ResultsScreen } from "@/components/quiz/results-screen";
import { database, type Attempt } from "@/lib/db";
import { getBestScore, listAttempts, saveAttempt } from "@/lib/data/attempts";
import { identity } from "@/app/identity";
import {
  buildQuiz,
  QUESTION_COUNT,
  type AnsweredQuestion,
  type Outcome,
  type Question,
} from "@/lib/quiz";
import { useStorageStatus, useStoredQuery } from "@/lib/storage/react";
import { cn } from "@/lib/utils";

/** How long the correct answer stays visible before the next question appears. */
const REVEAL_MS = 1200;

type Screen = "home" | "quiz" | "results";

const dayFormatter = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });

export function QuizApp() {
  const [screen, setScreen] = useState<Screen>("home");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<AnsweredQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const revealTimer = useRef<number | null>(null);

  const status = useStorageStatus(database);
  const { data: attempts, isLoading } = useStoredQuery(database, listAttempts);

  useEffect(() => {
    // The reveal timer must not fire into a screen that is gone.
    return () => {
      if (revealTimer.current !== null) window.clearTimeout(revealTimer.current);
    };
  }, []);

  const startQuiz = useCallback(() => {
    setQuestions(buildQuiz());
    setAnswers([]);
    setIndex(0);
    setPicked(null);
    setOutcome(null);
    setScreen("quiz");
  }, []);

  const finish = useCallback(async (finalScore: number) => {
    let previousBest: number | null = null;
    let saveError: string | null = null;
    try {
      previousBest = await getBestScore();
      await saveAttempt(finalScore, QUESTION_COUNT, Date.now());
    } catch (error) {
      saveError = error instanceof Error ? error.message : "unknown error";
    }
    const newBest = saveError === null && (previousBest === null || finalScore > previousBest);
    setOutcome({ score: finalScore, previousBest, newBest, perfect: finalScore === QUESTION_COUNT, saveError });
    if (saveError !== null) {
      toast.error(`Your score could not be saved: ${saveError}`);
    } else if (newBest) {
      toast.success(`New best: ${finalScore} out of ${QUESTION_COUNT}`);
    }
    setScreen("results");
  }, []);

  const answer = useCallback(
    (choice: number) => {
      // Locked once an answer is given, until the next question appears.
      if (picked !== null) return;
      const question = questions[index];
      if (!question) return;
      const isCorrect = choice === question.answerIndex;
      const scoreSoFar = answers.filter((a) => a.isCorrect).length + (isCorrect ? 1 : 0);
      setPicked(choice);
      setAnswers((current) => [...current, { question, picked: choice, isCorrect }]);
      revealTimer.current = window.setTimeout(() => {
        revealTimer.current = null;
        if (index + 1 >= QUESTION_COUNT) {
          void finish(scoreSoFar);
        } else {
          setIndex(index + 1);
          setPicked(null);
        }
      }, REVEAL_MS);
    },
    [answers, finish, index, picked, questions],
  );

  useEffect(() => {
    if (screen !== "quiz") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
      // Enter answers nothing and skips nothing: not an unanswered question, and not the reveal
      // pause after an answer. Preventing the default also stops it re-activating a focused
      // option button, which would otherwise count as answering.
      if (event.key === "Enter") {
        event.preventDefault();
        return;
      }
      if (event.key >= "1" && event.key <= "4") {
        // Keys 1–4 answer while the question is open and are locked out during the reveal.
        if (picked === null) {
          event.preventDefault();
          answer(Number(event.key) - 1);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [answer, picked, screen]);

  const quit = useCallback(() => {
    // Leaving mid-quiz must not let a pending reveal land the visitor on the results screen.
    if (revealTimer.current !== null) {
      window.clearTimeout(revealTimer.current);
      revealTimer.current = null;
    }
    setScreen("home");
  }, []);

  if (screen === "quiz") {
    return (
      <QuizScreen
        questions={questions}
        index={index}
        picked={picked}
        correctCount={answers.filter((a) => a.isCorrect).length}
        onAnswer={answer}
        onQuit={quit}
      />
    );
  }

  if (screen === "results" && outcome) {
    return (
      <ResultsScreen
        outcome={outcome}
        answers={answers}
        chartPoints={toChartPoints(attempts)}
        onPlayAgain={startQuiz}
      />
    );
  }

  return (
    <HomeScreen
      attempts={attempts}
      isLoading={isLoading}
      storageMemory={status === "memory"}
      onStart={startQuiz}
    />
  );
}

/** Newest-first attempts turned into chart points, oldest on the left, last twenty only. */
function toChartPoints(attempts: Attempt[] | undefined): ChartPoint[] {
  if (!attempts) return [];
  return [...attempts]
    .slice(0, 20)
    .reverse()
    .map((attempt) => ({ label: dayFormatter.format(attempt.playedAt), score: attempt.score }));
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="flex-1">
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

function HomeScreen({
  attempts,
  isLoading,
  storageMemory,
  onStart,
}: {
  attempts: Attempt[] | undefined;
  isLoading: boolean;
  storageMemory: boolean;
  onStart: () => void;
}) {
  const best = attempts && attempts.length > 0 ? Math.max(...attempts.map((a) => a.score)) : null;
  const played = attempts?.length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        {!isLoading && attempts && attempts.length > 0 ? (
          <Badge variant="outline" className="mb-3">
            {played} {played === 1 ? "quiz" : "quizzes"} played
          </Badge>
        ) : null}
        <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          {identity.name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Ten multiple-choice questions on the capitals of the world, drawn fresh every time.
          <span className="hidden sm:inline"> Answer with the keys 1–4 and press Enter for the next question.</span>
        </p>
      </div>

      {storageMemory ? (
        <Alert>
          <AlertTitle>This browser will not keep your data</AlertTitle>
          <AlertDescription>
            Scores and history work for this visit only. Export them to a file to keep them.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex gap-3">
        <StatCard
          label="Best score"
          value={best === null ? "—" : `${best}`}
          hint={best === null ? "No quiz yet" : `out of ${QUESTION_COUNT}`}
        />
        <StatCard label="Quizzes played" value={`${played}`} hint={played === 0 ? "Be the first" : "all time"} />
      </div>

      <Button size="lg" className="min-h-12 w-full text-base" onClick={onStart}>
        Start quiz
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Your history</CardTitle>
          <CardDescription>Scores from your recent quizzes, newest first.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {isLoading ? (
            <>
              <Skeleton className="h-[180px] w-full" />
              <Skeleton className="h-24 w-full" />
            </>
          ) : attempts && attempts.length > 0 ? (
            <>
              <div>
                <p className="mb-2 text-sm font-medium">Score across recent attempts</p>
                <ScoreChart points={toChartPoints(attempts)} />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Past quizzes</p>
                <AttemptsTable attempts={attempts} />
              </div>
            </>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Play your first quiz and your scores will build up here.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function QuizScreen({
  questions,
  index,
  picked,
  correctCount,
  onAnswer,
  onQuit,
}: {
  questions: Question[];
  index: number;
  picked: number | null;
  correctCount: number;
  onAnswer: (choice: number) => void;
  onQuit: () => void;
}) {
  const question = questions[index];
  const revealed = picked !== null;
  const chosenWasCorrect = revealed && picked === question.answerIndex;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold tabular-nums">
          Question {index + 1} of {QUESTION_COUNT}
        </p>
        <p className="text-sm text-muted-foreground tabular-nums" aria-live="polite">
          {correctCount} {correctCount === 1 ? "correct" : "correct so far"}
        </p>
      </div>

      {/* Ten segments, one per question, filled as they are answered. */}
      <div
        className="flex gap-1"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={QUESTION_COUNT}
        aria-valuenow={index + (revealed ? 1 : 0)}
        aria-label="Quiz progress"
      >
        {Array.from({ length: QUESTION_COUNT }, (_, i) => (
          <div
            key={i}
            aria-hidden="true"
            className={cn(
              "h-1.5 flex-1 rounded-full",
              i < index ? "bg-primary" : i === index ? "bg-primary/40" : "bg-border",
            )}
          />
        ))}
      </div>

      {question ? (
        <Card>
          <CardHeader>
            <CardDescription>{question.country.continent}</CardDescription>
            <CardTitle className="text-xl sm:text-2xl">
              What is the capital of {question.country.name}?
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {question.options.map((option, i) => {
              const isAnswer = i === question.answerIndex;
              const isPicked = picked === i;
              return (
                <Button
                  key={option}
                  variant={revealed ? (isPicked && chosenWasCorrect ? "default" : isPicked ? "destructive" : "outline") : "outline"}
                  className={cn(
                    "h-auto min-h-11 justify-start gap-3 py-2.5 text-left text-base",
                    revealed && !isPicked && !isAnswer && "opacity-50",
                  )}
                  aria-disabled={revealed}
                  onClick={() => onAnswer(i)}
                >
                  <span
                    aria-hidden="true"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-semibold"
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1">{option}</span>
                  {revealed && isAnswer ? (
                    <span aria-hidden="true" className="text-lg">
                      ✓
                    </span>
                  ) : null}
                  {revealed && isPicked && !chosenWasCorrect ? (
                    <span aria-hidden="true" className="text-lg">
                      ✗
                    </span>
                  ) : null}
                </Button>
              );
            })}
            <p aria-live="polite" className="min-h-6 pt-1 text-sm font-medium">
              {revealed
                ? chosenWasCorrect
                  ? "Correct!"
                  : `Not quite — the capital of ${question.country.name} is ${question.options[question.answerIndex]}.`
                : null}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onQuit}>
          Quit to home
        </Button>
        <p className="text-xs text-muted-foreground">
          <span className="hidden sm:inline">Press 1–4 to answer · the next question follows on its own</span>
          <span className="sm:hidden">Tap an answer to continue</span>
        </p>
      </div>
    </div>
  );
}