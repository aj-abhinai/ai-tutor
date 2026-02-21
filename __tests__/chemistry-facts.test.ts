import { GET } from "@/app/api/chemistry/facts/route";
import { getChemicalFactsFromFirestore } from "@/lib/firestore-lab";

jest.mock("@/lib/firestore-lab", () => ({
    getChemicalFactsFromFirestore: jest.fn(),
}));

const getChemicalFactsFromFirestoreMock =
    getChemicalFactsFromFirestore as jest.MockedFunction<
        typeof getChemicalFactsFromFirestore
    >;

describe("/api/chemistry/facts", () => {
    beforeEach(() => {
        getChemicalFactsFromFirestoreMock.mockReset();
    });

    it("returns chemical facts from firestore", async () => {
        getChemicalFactsFromFirestoreMock.mockResolvedValue({
            "Hydrochloric Acid (HCl)": {
                fact: "Your stomach uses this acid to digest food!",
                state: "Liquid",
            },
        });

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.facts["Hydrochloric Acid (HCl)"].state).toBe("Liquid");
    });
});

