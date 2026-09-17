export interface RubricCriterion {
  id: string;
  description: string;
  points: number;
}

export interface GradingInput {
  question: string;
  studentAnswer: string;
  rubric: readonly RubricCriterion[];
  conceptContext: readonly string[];
  answerType: "SHORT_TEXT" | "LONG_TEXT";
}

export interface CriterionAssessment {
  criterionId: string;
  awarded: number;
  possible: number;
  met: boolean;
  evidence: string;
}

export interface GradingResult {
  schemaVersion: "1.0";
  score: number;
  maxScore: number;
  confidence: number;
  criteria: CriterionAssessment[];
  misconceptions: string[];
  studentFeedback: string;
  reviewFlags: string[];
}

export interface GradingDecision {
  result: GradingResult;
  requiresTeacherReview: boolean;
  reviewReasons: string[];
}

export class InvalidGradingResultError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidGradingResultError";
  }
}

/** Independently validate model claims against the immutable rubric snapshot. */
export function validateGradingResult(input: GradingInput, result: GradingResult): GradingResult {
  const expectedMax = input.rubric.reduce((sum, criterion) => sum + criterion.points, 0);
  if (result.schemaVersion !== "1.0")
    throw new InvalidGradingResultError("Unsupported grading schema.");
  if (!Number.isFinite(result.confidence) || result.confidence < 0 || result.confidence > 1)
    throw new InvalidGradingResultError("Confidence must be between zero and one.");
  if (result.maxScore !== expectedMax || result.score < 0 || result.score > expectedMax)
    throw new InvalidGradingResultError("Score bounds do not match the rubric.");
  if (result.criteria.length !== input.rubric.length)
    throw new InvalidGradingResultError("Every rubric criterion must be assessed exactly once.");

  const seen = new Set<string>();
  let score = 0;
  for (const assessment of result.criteria) {
    const criterion = input.rubric.find((item) => item.id === assessment.criterionId);
    if (!criterion || seen.has(assessment.criterionId))
      throw new InvalidGradingResultError(
        "Criterion identity is missing, unexpected, or duplicated.",
      );
    seen.add(assessment.criterionId);
    if (
      assessment.possible !== criterion.points ||
      !Number.isFinite(assessment.awarded) ||
      assessment.awarded < 0 ||
      assessment.awarded > criterion.points
    )
      throw new InvalidGradingResultError("Criterion points are outside rubric bounds.");
    if (assessment.met !== (assessment.awarded === criterion.points))
      throw new InvalidGradingResultError(
        "Criterion met status does not match its awarded points.",
      );
    if (assessment.awarded > 0 && !assessment.evidence.trim())
      throw new InvalidGradingResultError("Awarded points require supporting answer evidence.");
    score += assessment.awarded;
  }
  if (score !== result.score)
    throw new InvalidGradingResultError("Total score does not equal criterion scores.");
  if (!result.studentFeedback.trim())
    throw new InvalidGradingResultError("Student feedback cannot be empty.");
  return result;
}

/** Conservative PRD defaults: confidence is a review signal, not a probability. */
export function decideGradingReview(
  input: GradingInput,
  result: GradingResult,
  minimumConfidence = 0.8,
): GradingDecision {
  const reasons = new Set(result.reviewFlags.map((flag) => `model_flag:${flag}`));
  if (result.confidence < minimumConfidence) reasons.add("low_confidence");
  if (input.answerType === "LONG_TEXT" && (result.score === 0 || result.score === result.maxScore))
    reasons.add("long_answer_extreme_score");
  if (result.criteria.some((criterion) => criterion.awarded > 0 && !criterion.evidence.trim()))
    reasons.add("missing_criterion_evidence");
  return { result, requiresTeacherReview: reasons.size > 0, reviewReasons: [...reasons] };
}
