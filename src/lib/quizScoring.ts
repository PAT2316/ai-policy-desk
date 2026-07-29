export interface QuizAnswerSubmission {
  questionId: string;
  submittedAnswer: string;
}

export interface QuizQuestionAnswerKey {
  questionId: string;
  correctAnswer: string;
}

export interface QuizResult {
  score: number; // pourcentage 0-100
  passed: boolean;
  correctCount: number;
  totalCount: number;
}

export function scoreQuiz(
  submissions: QuizAnswerSubmission[],
  answerKey: QuizQuestionAnswerKey[],
  passingScore: number
): QuizResult {
  const keyMap = new Map(answerKey.map((k) => [k.questionId, k.correctAnswer]));

  let correctCount = 0;
  for (const submission of submissions) {
    if (keyMap.get(submission.questionId) === submission.submittedAnswer) {
      correctCount += 1;
    }
  }

  const totalCount = answerKey.length;
  const score = totalCount === 0 ? 0 : Math.round((correctCount / totalCount) * 100);

  return { score, passed: score >= passingScore, correctCount, totalCount };
}
