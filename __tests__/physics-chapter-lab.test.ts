import { NextRequest } from "next/server";
import { GET } from "@/app/api/physics/chapter-lab/route";
import { getRequestUserId } from "@/lib/api/shared";
import { getPhysicsChapterLabFromFirestore } from "@/lib/physics/firestore";

jest.mock("@/lib/physics/firestore", () => ({
    getPhysicsChapterLabFromFirestore: jest.fn(),
}));
jest.mock("@/lib/api/shared", () => ({
    getRequestUserId: jest.fn(),
}));

const getPhysicsChapterLabFromFirestoreMock =
    getPhysicsChapterLabFromFirestore as jest.MockedFunction<
        typeof getPhysicsChapterLabFromFirestore
    >;
const getRequestUserIdMock =
    getRequestUserId as jest.MockedFunction<typeof getRequestUserId>;

describe("/api/physics/chapter-lab", () => {
    beforeEach(() => {
        getPhysicsChapterLabFromFirestoreMock.mockReset();
        getRequestUserIdMock.mockReset();
        getRequestUserIdMock.mockResolvedValue("student-1");
    });

    it("rejects missing chapterId query", async () => {
        const request = new NextRequest("http://localhost/api/physics/chapter-lab");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain("chapterId");
    });

    it("returns firestore chapter lab when available", async () => {
        getPhysicsChapterLabFromFirestoreMock.mockResolvedValue({
            chapterId: "electricity-circuits",
            chapterTitle: "Electricity: Circuits and Their Components",
            experiments: [],
        });

        const request = new NextRequest(
            "http://localhost/api/physics/chapter-lab?chapterId=electricity-circuits"
        );
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.source).toBe("firestore");
        expect(data.chapterLab.chapterId).toBe("electricity-circuits");
    });

    it("returns 404 when firestore has no chapter lab", async () => {
        getPhysicsChapterLabFromFirestoreMock.mockResolvedValue(null);

        const request = new NextRequest(
            "http://localhost/api/physics/chapter-lab?chapterId=electricity-circuits"
        );
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toContain("No physics lab");
    });
});
