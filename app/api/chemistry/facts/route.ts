import { getChemicalFactsFromFirestore } from "@/lib/firestore-lab";
import { createChemistryRoute } from "@/lib/api/create-chemistry-route";

export const GET = createChemistryRoute(
  "facts",
  getChemicalFactsFromFirestore,
  "Failed to load chemistry facts"
);
