import { NextRequest } from "next/server";
import { POST as deepPost } from "@/app/api/deep/route";
import { POST as expandPost } from "@/app/api/expand/route";
import { GET as chemistryFactsGet } from "@/app/api/chemistry/facts/route";
import { GET as physicsChapterLabGet } from "@/app/api/physics/chapter-lab/route";

const DEEP_BODY = {
  subject: "Science",
  chapterId: "electricity-circuits",
  topicId: "circuits-and-switches",
  subtopicId: "closed-open-circuits",
};

const EXPAND_BODY = {
  subject: "Maths",
  chapterId: "fractions-decimals",
  topicId: "fractions-basics",
  subtopicId: "equivalent-fractions",
  level: "standard",
};

function makePostRequest(path: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Auth guards (additional protected routes)", () => {
  it("requires login for /api/deep", async () => {
    const response = await deepPost(makePostRequest("/api/deep", DEEP_BODY));
    expect(response.status).toBe(401);
  });

  it("requires login for /api/expand", async () => {
    const response = await expandPost(makePostRequest("/api/expand", EXPAND_BODY));
    expect(response.status).toBe(401);
  });

  it("requires login for /api/chemistry/facts", async () => {
    const request = new NextRequest("http://localhost/api/chemistry/facts");
    const response = await chemistryFactsGet(request);
    expect(response.status).toBe(401);
  });

  it("requires login for /api/physics/chapter-lab", async () => {
    const request = new NextRequest(
      "http://localhost/api/physics/chapter-lab?chapterId=electricity-circuits"
    );
    const response = await physicsChapterLabGet(request);
    expect(response.status).toBe(401);
  });
});
