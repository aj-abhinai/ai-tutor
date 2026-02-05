/**
 * Tests for /api/deep route
 */

import { NextRequest } from "next/server";
import { POST } from "@/app/api/deep/route";

const generateContentMock = jest.fn();

jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: generateContentMock,
    }),
  })),
}));

const VALID_BODY = {
  subject: "Science" as const,
  chapterId: "electricity-circuits",
  topicId: "circuits-and-switches",
  subtopicId: "closed-open-circuits",
};

const makeJsonRequest = (body: unknown, headers: Record<string, string> = {}) =>
  new NextRequest("http://localhost/api/deep", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

describe("/api/deep - Deep explanation API", () => {
  beforeEach(() => {
    generateContentMock.mockReset();
    process.env.GEMINI_API_KEY = "test-key";
  });

  it("rejects missing subject", async () => {
    const response = await POST(
      makeJsonRequest({
        chapterId: VALID_BODY.chapterId,
        topicId: VALID_BODY.topicId,
        subtopicId: VALID_BODY.subtopicId,
      })
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("Subject");
  });

  it("rejects invalid subject", async () => {
    const response = await POST(makeJsonRequest({ ...VALID_BODY, subject: "History" }));

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("Subject");
  });

  it("rejects ids longer than 120 characters", async () => {
    const response = await POST(
      makeJsonRequest({ ...VALID_BODY, chapterId: "a".repeat(121) })
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("120");
  });

  it("returns deepEssay when the model succeeds", async () => {
    generateContentMock.mockResolvedValue({
      response: { text: () => JSON.stringify({ deepEssay: "<p>Deep</p>" }) },
    });

    const response = await POST(makeJsonRequest(VALID_BODY));

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(typeof data.deepEssay).toBe("string");
    expect(data.deepEssay).toContain("<p>");
  });

  it("returns 502 when model returns invalid JSON", async () => {
    generateContentMock.mockResolvedValue({
      response: { text: () => "not json" },
    });

    const response = await POST(makeJsonRequest(VALID_BODY));

    expect(response.status).toBe(502);
    const data = await response.json();
    expect(data.error).toContain("invalid JSON");
  });
});
