/**
 * This app's queries over the attempt history. Components call these, never Dexie.
 *
 * Every write is awaited by its caller and every failure is propagated, so a lost save is visible
 * rather than silent.
 */
import { database, newId, type Attempt } from "@/lib/db";

const attempts = async () => (await database.ready()).attempts;

/** All completed attempts, newest first. */
export async function listAttempts(): Promise<Attempt[]> {
  return (await attempts()).orderBy("playedAt").reverse().toArray();
}

/** The highest score across every attempt, or null when nothing has been played yet. */
export async function getBestScore(): Promise<number | null> {
  const rows = await (await attempts()).toArray();
  if (rows.length === 0) return null;
  return rows.reduce((best, row) => Math.max(best, row.score), 0);
}

/** Save one finished quiz. Returns the stored row. */
export async function saveAttempt(score: number, total: number, playedAt: number): Promise<Attempt> {
  const attempt: Attempt = { id: newId(), score, total, playedAt };
  await (await attempts()).put(attempt);
  return attempt;
}

/** Remove every attempt. Used only by the "Clear history" control, which asks first. */
export async function clearAttempts(): Promise<void> {
  await (await attempts()).clear();
}
