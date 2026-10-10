import { QuizApp } from "@/components/quiz/quiz-app";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 py-8 sm:px-6 sm:py-14">
      <QuizApp />
    </main>
  );
}
