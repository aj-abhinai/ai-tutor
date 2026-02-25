import { NextRequest } from "next/server";
import { GET } from "@/app/api/physics/lab-chapters/route";
import { getPhysicsLabChapterIdsFromFirestore } from "@/lib/firestore-lab";
import { getRequestUserId } from "@/lib/api/shared";

jest.mock("@/lib/firestore-lab", () => ({
    getPhysicsLabChapterIdsFromFirestore: jest.fn(),
}));
jest.mock("@/lib/api/shared", () => ({
    getRequestUserId: jest.fn(),
}));

const getPhysicsLabChapterIdsFromFirestoreMock =
    getPhysicsLabChapterIdsFromFirestore as jest.MockedFunction<
        typeof getPhysicsLabChapterIdsFromFirestore
    >;
const getRequestUserIdMock =
    getRequestUserId as jest.MockedFunction<typeof getRequestUserId>;

describe("/api/physics/lab-chapters", () => {
    beforeEach(() => {
        getPhysicsLabChapterIdsFromFirestoreMock.mockReset();
        getRequestUserIdMock.mockReset();
        getRequestUserIdMock.mockResolvedValue("student-1");
    });

    it("returns chapter IDs from firestore", async () => {
        getPhysicsLabChapterIdsFromFirestoreMock.mockResolvedValue([
            "electricity-circuits",
        ]);

        const request = new NextRequest("http://localhost/api/physics/lab-chapters");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.chapterIds).toEqual(["electricity-circuits"]);
    });
});

