"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShareButton } from "@/components/share-button";
import { renderShareCard } from "@/lib/share";
import { identity } from "@/app/identity";
import { QUESTION_COUNT, type AnsweredQuestion, type Outcome } from "@/lib/quiz";
import { ScoreChart, type ChartPoint } from "@/components/quiz/score-chart";
import { cn } from "@/lib/utils";

/**
 * The end of a quiz: the score, how it compares with the best before it, a shareable image card
 * of the result, and a play-again button. The score chart covers recent attempts including this
 * one, so progress is visible straight after finishing.
 */
export function ResultsScreen({
  outcome,
  answers,
  chartPoints,
  onPlayAgain,
}: {
  outcome: Outcome;
  answers: AnsweredQuestion[];
  chartPoints: ChartPoint[];
  onPlayAgain: () => void;
}) {
  const { score, previousBest, newBest, perfect, saveError } = outcome;

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Quiz complete
        </p>
        <p className="mt-1 text-6xl font-bold tabular-nums tracking-tight">
          {score}
          <span className="text-3xl font-medium text-muted-foreground"> / {QUESTION_COUNT}</span>
        </p>

        {perfect ? (
          <Card className="mx-auto mt-4 max-w-sm border-[color:var(--chart-2)] bg-[color:var(--chart-2)]/10">
            <CardContent className="p-4">
              <p className="flex items-center justify-center gap-2 font-semibold text-foreground">
                <span aria-hidden="true">🏆</span> Perfect score!
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                All ten capitals right. You know the world.
              </p>
            </CardContent>
          </Card>
        ) : newBest ? (
          previousBest === null ? (
            <p className="mt-4 font-semibold text-foreground">
              <Badge>Score to beat</Badge> Your first quiz — this is now your best.
            </p>
          ) : (
            <p className="mt-4 font-semibold text-foreground">
              <Badge>New personal best</Badge> You beat your previous best of {previousBest}.
            </p>
          )
        ) : previousBest === null ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Your first quiz — every score after this one is measured against it.
          </p>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Your best is still {previousBest} / {QUESTION_COUNT}.
          </p>
        )}

        {saveError ? (
          <p role="alert" className="mt-3 text-sm text-destructive">
            This attempt could not be saved: {saveError}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <Button size="lg" className="min-h-11 w-full sm:w-auto" onClick={onPlayAgain}>
          Play again
        </Button>
        <ShareButton
          className="w-full sm:w-auto [&>button]:w-full"
          label="Share result"
          title={`${score}/${QUESTION_COUNT} on ${identity.name}`}
          text={`I scored ${score} out of ${QUESTION_COUNT} on ${identity.name}`}
          filename="capital-cities-score.png"
          cacheKey={`${score}/${previousBest}/${chartPoints.length}`}
          makeImage={() =>
            renderShareCard({
              title: `${score} / ${QUESTION_COUNT}`,
              subtitle: `My score on ${identity.name}`,
              lines: [
                perfect ? "A perfect score!" : newBest ? "New personal best" : `Best so far: ${previousBest}`,
                `${chartPoints.length} ${chartPoints.length === 1 ? "quiz" : "quizzes"} played`,
              ],
              format: "square",
            })
          }
        />
      </div>

      {chartPoints.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Score over recent attempts</CardTitle>
            <CardDescription>Oldest to newest, including this one.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScoreChart points={chartPoints} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Review</CardTitle>
          <CardDescription>Every question from this quiz, with the right answer.</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-col gap-3">
            {answers.map(({ question, picked, isCorrect }, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span
                  aria-label={isCorrect ? "Correct" : "Incorrect"}
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    isCorrect
                      ? "bg-[color:var(--chart-2)]/15 text-[color:var(--chart-2)]"
                      : "bg-destructive/15 text-destructive",
                  )}
                >
                  {isCorrect ? "✓" : "✗"}
                </span>
                <div>
                  <p className="font-medium">
                    {i + 1}. What is the capital of {question.country.name}?
                  </p>
                  <p className="text-muted-foreground">
                    {isCorrect ? question.options[picked] : (
                      <>
                        You answered {question.options[picked]}; the capital is{" "}
                        <span className="font-medium text-foreground">
                          {question.options[question.answerIndex]}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}