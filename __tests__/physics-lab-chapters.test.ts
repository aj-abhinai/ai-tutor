import { GET } from "@/app/api/physics/lab-chapters/route";
import { getPhysicsLabChapterIdsFromFirestore } from "@/lib/firestore-lab";

jest.mock("@/lib/firestore-lab", () => ({
    getPhysicsLabChapterIdsFromFirestore: jest.fn(),
}));

const getPhysicsLabChapterIdsFromFirestoreMock =
    getPhysicsLabChapterIdsFromFirestore as jest.MockedFunction<
        typeof getPhysicsLabChapterIdsFromFirestore
    >;

describe("/api/physics/lab-chapters", () => {
    beforeEach(() => {
        getPhysicsLabChapterIdsFromFirestoreMock.mockReset();
    });

    it("returns chapter IDs from firestore", async () => {
        getPhysicsLabChapterIdsFromFirestoreMock.mockResolvedValue([
            "electricity-circuits",
        ]);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.chapterIds).toEqual(["electricity-circuits"]);
    });
});

