import { describe, expect, it } from "vitest";
import {
  decideGradingReview,
  validateGradingResult,
  type GradingInput,
  type GradingResult,
} from "./grading.ts";

const input: GradingInput = {
  question: "Explain how a plant gets water.",
  studentAnswer: "Water moves up the stem.",
  answerType: "SHORT_TEXT",
  conceptContext: ["transport in plants"],
  rubric: [
    { id: "evidence", description: "Explains water transport", points: 2 },
    { id: "concept", description: "Names the stem", points: 1 },
  ],
};
const result: GradingResult = {
  schemaVersion: "1.0",
  score: 3,
  maxScore: 3,
  confidence: 0.92,
  criteria: [
    { criterionId: "evidence", awarded: 2, possible: 2, met: true, evidence: "Water moves up" },
    { criterionId: "concept", awarded: 1, possible: 1, met: true, evidence: "the stem" },
  ],
  misconceptions: [],
  studentFeedback: "Good explanation.",
  reviewFlags: [],
};

describe("AI grading validation and review policy", () => {
  it("accepts rubric-aligned scores and routes confident short answers for review only when flagged", () => {
    expect(validateGradingResult(input, result)).toEqual(result);
    expect(decideGradingReview(input, result).requiresTeacherReview).toBe(false);
  });
  it("rejects fabricated criteria, arithmetic mismatch, and points without evidence", () => {
    expect(() => validateGradingResult(input, { ...result, score: 2 })).toThrow(/total score/i);
    expect(() =>
      validateGradingResult(input, {
        ...result,
        criteria: result.criteria.map((c) => ({ ...c, criterionId: "made-up" })),
      }),
    ).toThrow(/identity/);
    expect(() =>
      validateGradingResult(input, {
        ...result,
        criteria: [{ ...result.criteria[0]!, evidence: " " }, result.criteria[1]!],
      }),
    ).toThrow(/evidence/);
  });
  it("requires teacher review for low confidence, long-answer extremes, and model safety flags", () => {
    const low = decideGradingReview(input, { ...result, confidence: 0.79 });
    expect(low.reviewReasons).toContain("low_confidence");
    const longInput = { ...input, answerType: "LONG_TEXT" as const };
    expect(decideGradingReview(longInput, result).reviewReasons).toContain(
      "long_answer_extreme_score",
    );
    expect(
      decideGradingReview(input, { ...result, reviewFlags: ["safety_concern"] })
        .requiresTeacherReview,
    ).toBe(true);
  });
});
