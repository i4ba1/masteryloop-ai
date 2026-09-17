import {
  decideGradingReview,
  validateGradingResult,
  type GradingDecision,
  type GradingInput,
  type GradingResult,
} from "@masteryloop/domain";

export interface AiGraderPort {
  grade(input: GradingInput): Promise<GradingResult>;
}

/** Generate a suggestion, validate it against the rubric, and decide review routing. */
export async function gradeAnswer(
  grader: AiGraderPort,
  input: GradingInput,
): Promise<GradingDecision> {
  const result = await grader.grade(input);
  validateGradingResult(input, result);
  return decideGradingReview(input, result);
}
