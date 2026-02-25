import { getChemicalsFromFirestore } from "@/lib/firestore-lab";
import { createChemistryRoute } from "@/lib/api/create-chemistry-route";

export const GET = createChemistryRoute(
  "chemicals",
  getChemicalsFromFirestore,
  "Failed to load chemistry chemicals"
);
