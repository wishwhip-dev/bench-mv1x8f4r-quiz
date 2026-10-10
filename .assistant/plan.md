# Plan

Goal: A quick quiz on world capitals: 10 questions, multiple choice, a score at the end with a Share result button that posts an image card of my score, and a best-score that survives a reload. On a laptop I can answer with the keys 1 to 4 and press Enter for the next question. Must look good on a phone.

1. The home page shows a 'Start quiz' button that begins the quiz immediately from the home page with no URL parameter or navigation, alongside a readout of the best score so far and the total quizzes played
2. The quiz asks exactly 10 multiple-choice questions, each with one capital-city question and four answer options, drawn from a data module in lib/data holding at least 120 countries and their capitals across all continents, separate from the quiz component; both the question order and the position of the correct option are shuffled each play, and no question repeats within a single quiz
3. On a laptop keyboard, pressing the keys 1 to 4 answers the corresponding option and pressing Enter moves to the next question after an answer is given; the keys have no effect on the home or results screens
4. Clicking or tapping an option also answers the question; the chosen option is highlighted and the correct answer is revealed with distinct correct/incorrect marks, staying visible for a short pause before the next question appears
5. During the quiz a progress readout shows 'Question X of 10' and the running number of correct answers so far
6. After the 10th question a results screen shows the final score out of 10, states whether it beat the previous best (a perfect 10 shown as a distinct 'Perfect score' message), and a 'Share result' button that shares or saves an image card of the score, or copies it, with the outcome shown as text beside the button
7. The results screen offers a 'Play again' button that restarts the quiz with a freshly shuffled set of 10 questions, resetting the progress readout to 'Question 1 of 10' and the correct count to zero
8. The best score and each completed attempt are saved in the Dexie database when the quiz finishes, and after reloading the page the home page still shows the same best score and the same attempt history
9. The results and home screens show a line chart of the score across the last attempts, drawn with the shipped chart component, so progress over time is visible
10. The home page lists the results of the last quizzes as a table with date and score, newest first, so past attempts can be checked at a glance
11. Edge cases behave: pressing Enter with no answer selected does nothing and does not skip the question; pressing 1 to 4 after answering is locked out until the next question; pressing Enter during the reveal pause does not skip the reveal; finishing question 10 with Enter lands on the results screen; reloading the page mid-quiz returns to the home screen with the saved best score and history intact, not a half-finished quiz
12. On a phone-sized screen the four answer options stack as full-width buttons of at least 44px height, the progress readout and score fit the viewport without horizontal scrolling, and keyboard hints are hidden or adapted for touch
13. The app's name, title and description in app/identity.ts are updated to describe the capitals quiz

These are the outcomes this task is judged against.