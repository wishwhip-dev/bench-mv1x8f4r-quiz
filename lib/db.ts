/**
 * This application's database.
 *
 * The reusable half of the setup is in `lib/storage/` and is not edited. This file is the half
 * that describes the product: which tables exist, what is indexed, and how the schema has changed
 * over time.
 *
 * A quiz keeps one thing worth remembering: each completed attempt, with its score and when it
 * was played. The best score and the number of quizzes played are derived from these rows in
 * `lib/data/attempts.ts`, so there is no second table to keep in step.
 */
import { defineDatabase } from "@/lib/storage/database";

export type Attempt = {
  id: string;
  /** How many of the 10 questions were answered correctly. */
  score: number;
  /** Always 10 for this quiz; stored so the history stays honest if the quiz ever grows. */
  total: number;
  /** Epoch millis. Indexed, because the history is ordered by it. */
  playedAt: number;
};

/** Ids are generated here so the data layer never depends on an auto-increment round trip. */
export function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const database = defineDatabase<{ attempts: Attempt }>({
  // Part of the origin's storage identity. Renaming it does not migrate anything — it points the
  // application at a different, empty database and abandons the old one in place. That is exactly
  // what you want on a first build, and never what you want afterwards.
  name: "capitals-quiz",
  versions: [
    // Only the primary key and the properties queried on. `total` is stored but never filtered or
    // sorted by, so indexing it would cost writes and buy nothing.
    { version: 1, stores: { attempts: "id, playedAt" } },
  ],
  // No seed: a quiz with no attempts yet is the honest starting state, and the home screen says so
  // rather than inventing history.
});
