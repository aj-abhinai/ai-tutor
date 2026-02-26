import { NextRequest } from "next/server";
import { GET } from "@/app/api/chemistry/facts/route";
import { getChemicalFactsFromFirestore } from "@/lib/chemistry/firestore";
import { getRequestUserId } from "@/lib/api/shared";

jest.mock("@/lib/chemistry/firestore", () => ({
    getChemicalFactsFromFirestore: jest.fn(),
}));
jest.mock("@/lib/api/shared", () => ({
    getRequestUserId: jest.fn(),
}));

const getChemicalFactsFromFirestoreMock =
    getChemicalFactsFromFirestore as jest.MockedFunction<
        typeof getChemicalFactsFromFirestore
    >;
const getRequestUserIdMock =
    getRequestUserId as jest.MockedFunction<typeof getRequestUserId>;

describe("/api/chemistry/facts", () => {
    beforeEach(() => {
        getChemicalFactsFromFirestoreMock.mockReset();
        getRequestUserIdMock.mockReset();
        getRequestUserIdMock.mockResolvedValue("student-1");
    });

    it("returns chemical facts from firestore", async () => {
        getChemicalFactsFromFirestoreMock.mockResolvedValue({
            "Hydrochloric Acid (HCl)": {
                fact: "Your stomach uses this acid to digest food!",
                state: "Liquid",
            },
        });

        const request = new NextRequest("http://localhost/api/chemistry/facts");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.facts["Hydrochloric Acid (HCl)"].state).toBe("Liquid");
    });
});
