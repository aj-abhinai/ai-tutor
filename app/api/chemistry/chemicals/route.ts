import { getChemicalsFromFirestore } from "@/lib/chemistry/firestore";
import { createChemistryRoute } from "@/lib/api/create-chemistry-route";

export const GET = createChemistryRoute(
  "chemicals",
  getChemicalsFromFirestore,
  "Failed to load chemistry chemicals"
);
