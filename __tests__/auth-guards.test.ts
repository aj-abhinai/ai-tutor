import { NextRequest } from "next/server";
import { POST as explainPost } from "@/app/api/explain/route";
import { POST as feedbackPost } from "@/app/api/feedback/route";
import { POST as labPost } from "@/app/api/lab/route";

const EXPLAIN_BODY = {
  subject: "Science",
  chapterId: "electricity-circuits",
  topicId: "circuits-and-switches",
  subtopicId: "closed-open-circuits",
};

const FEEDBACK_BODY = {
  ...EXPLAIN_BODY,
  studentAnswer: "A closed circuit lets current flow.",
};

const LAB_BODY = {
  chemicalA: "Acid",
  chemicalB: "Base",
};

function makeRequest(path: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Auth guards", () => {
  it("requires login for /api/explain", async () => {
    const response = await explainPost(makeRequest("/api/explain", EXPLAIN_BODY));
    expect(response.status).toBe(401);
  });

  it("requires login for /api/feedback", async () => {
    const response = await feedbackPost(makeRequest("/api/feedback", FEEDBACK_BODY));
    expect(response.status).toBe(401);
  });

  it("requires login for /api/lab", async () => {
    const response = await labPost(makeRequest("/api/lab", LAB_BODY));
    expect(response.status).toBe(401);
  });
});
