"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Attempt } from "@/lib/db";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/**
 * The attempt history, newest first. Dates are formatted in the browser only — the caller never
 * renders this on the server, where the visitor's locale is unknown.
 */
export function AttemptsTable({ attempts }: { attempts: Attempt[] }) {
  if (attempts.length === 0) {
    return (
      <p className="px-2 py-6 text-center text-sm text-muted-foreground">
        No quizzes played yet. Your first result will appear here.
      </p>
    );
  }

  return (
    <div className="max-h-80 overflow-y-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Score</TableHead>
            <TableHead className="hidden text-right sm:table-cell">Correct</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attempts.map((attempt) => (
            <TableRow key={attempt.id}>
              <TableCell>{dateFormatter.format(attempt.playedAt)}</TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {attempt.score} / {attempt.total}
              </TableCell>
              <TableCell className="hidden text-right tabular-nums text-muted-foreground sm:table-cell">
                {Math.round((attempt.score / attempt.total) * 100)}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}