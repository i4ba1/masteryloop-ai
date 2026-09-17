import { describe, expect, it, vi } from "vitest";
import { AiProviderError, ResponsesGrader } from "./responses-grader.ts";

const output = {
  output: [
    {
      type: "message",
      content: [
        {
          type: "output_text",
          text: JSON.stringify({
            schemaVersion: "1.0",
            score: 1,
            maxScore: 1,
            confidence: 0.9,
            criteria: [
              {
                criterionId: "c1",
                awarded: 1,
                possible: 1,
                met: true,
                evidence: "stated the answer",
              },
            ],
            misconceptions: [],
            studentFeedback: "Well done.",
            reviewFlags: [],
          }),
        },
      ],
    },
  ],
};
const input = {
  question: "What is 1+1?",
  studentAnswer: "2",
  answerType: "SHORT_TEXT" as const,
  conceptContext: ["addition"],
  rubric: [{ id: "c1", description: "Correct answer", points: 1 }],
};

describe("ResponsesGrader", () => {
  it("uses strict structured output, disables response storage, and parses output_text", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json(output));
    const grader = new ResponsesGrader("secret", "approved-model", fetcher);
    await expect(grader.grade(input)).resolves.toMatchObject({
      score: 1,
      criteria: [{ criterionId: "c1" }],
    });
    const request = JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body));
    expect(request.store).toBe(false);
    expect(request.text.format).toMatchObject({ type: "json_schema", strict: true });
    expect(request.tools).toBeUndefined();
    expect(request.input).toContain("studentAnswer");
  });
  it("classifies provider rate limits and refuses malformed model output", async () => {
    const rateLimited = new ResponsesGrader(
      "key",
      "model",
      vi.fn<typeof fetch>().mockResolvedValue(new Response("", { status: 429 })),
    );
    await expect(rateLimited.grade(input)).rejects.toMatchObject({ kind: "rate_limit" });
    const malformed = new ResponsesGrader(
      "key",
      "model",
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          Response.json({ output: [{ content: [{ type: "output_text", text: "{}" }] }] }),
        ),
    );
    await expect(malformed.grade(input)).rejects.toBeInstanceOf(AiProviderError);
  });
});
