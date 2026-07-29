import { describe, it, expect } from "vitest";
import { scoreQuiz } from "@/lib/quizScoring";

describe("scoreQuiz", () => {
  const answerKey = [
    { questionId: "q1", correctAnswer: "a" },
    { questionId: "q2", correctAnswer: "b" },
    { questionId: "q3", correctAnswer: "c" },
    { questionId: "q4", correctAnswer: "d" },
  ];

  it("calcule 100% si toutes les réponses sont correctes", () => {
    const submissions = answerKey.map((k) => ({ questionId: k.questionId, submittedAnswer: k.correctAnswer }));
    expect(scoreQuiz(submissions, answerKey, 70).score).toBe(100);
  });

  it("échoue sous le seuil de réussite", () => {
    const submissions = [
      { questionId: "q1", submittedAnswer: "a" },
      { questionId: "q2", submittedAnswer: "wrong" },
      { questionId: "q3", submittedAnswer: "wrong" },
      { questionId: "q4", submittedAnswer: "wrong" },
    ];
    const result = scoreQuiz(submissions, answerKey, 70);
    expect(result.score).toBe(25);
    expect(result.passed).toBe(false);
  });

  it("réussit exactement au seuil", () => {
    const submissions = [
      { questionId: "q1", submittedAnswer: "a" },
      { questionId: "q2", submittedAnswer: "b" },
      { questionId: "q3", submittedAnswer: "c" },
      { questionId: "q4", submittedAnswer: "wrong" },
    ];
    const result = scoreQuiz(submissions, answerKey, 75);
    expect(result.score).toBe(75);
    expect(result.passed).toBe(true);
  });
});
