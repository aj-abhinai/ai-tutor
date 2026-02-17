import { NextRequest } from "next/server";
import { GET } from "@/app/api/catalog/route";
import { getCatalogFromDB } from "@/lib/rag";

jest.mock("@/lib/rag", () => ({
  getCatalogFromDB: jest.fn(),
}));

const getCatalogFromDBMock = getCatalogFromDB as jest.MockedFunction<typeof getCatalogFromDB>;

describe("/api/catalog", () => {
  beforeEach(() => {
    getCatalogFromDBMock.mockReset();
  });

  it("rejects invalid subject query", async () => {
    const request = new NextRequest("http://localhost/api/catalog?subject=History");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Subject");
  });

  it("returns DB catalog", async () => {
    getCatalogFromDBMock.mockResolvedValue({
      subject: "Science",
      chapters: [
        {
          id: "electricity-circuits",
          title: "Electricity: Circuits and Their Components",
          topics: [
            {
              id: "circuits-and-switches",
              title: "Circuits and Switches",
              subtopics: [{ id: "closed-open-circuits", title: "Closed and Open Circuits" }],
            },
          ],
        },
      ],
    });

    const request = new NextRequest("http://localhost/api/catalog?subject=Science");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.catalog.subject).toBe("Science");
    expect(data.catalog.chapters[0].id).toBe("electricity-circuits");
  });
});

