/**
 * Pure quiz logic, no React: how a quiz is drawn from the country data. The order of the
 * questions and the position of the correct option are shuffled on every call, and no question
 * repeats within a single quiz.
 */
import { countries, type Country } from "@/lib/data/countries";

export const QUESTION_COUNT = 10;
export const OPTION_COUNT = 4;

export type Question = {
  country: Country;
  /** Exactly four capital names, shuffled; one of them is the country's own capital. */
  options: string[];
  /** Where the correct capital sits in `options`. */
  answerIndex: number;
};

/** One answered question, kept so the results screen can review the whole quiz. */
export type AnsweredQuestion = {
  question: Question;
  /** Which option was chosen, by index. */
  picked: number;
  isCorrect: boolean;
};

export type Outcome = {
  score: number;
  /** The best score from earlier attempts, or null when this was the first quiz. */
  previousBest: number | null;
  /** True when this attempt strictly beat every earlier one. */
  newBest: boolean;
  perfect: boolean;
  /** Set when writing the attempt to the database failed, so the screen can say so. */
  saveError: string | null;
};

/** Fisher–Yates over a copy; the input is left alone. */
export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildQuiz(): Question[] {
  const picked = shuffle(countries).slice(0, QUESTION_COUNT);
  return picked.map((country) => {
    const distractors = shuffle(
      countries.filter((other) => other.name !== country.name && other.capital !== country.capital),
    )
      .slice(0, OPTION_COUNT - 1)
      .map((other) => other.capital);
    const options = shuffle([country.capital, ...distractors]);
    return { country, options, answerIndex: options.indexOf(country.capital) };
  });
}
