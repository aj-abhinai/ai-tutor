import { getExperimentsFromFirestore } from "@/lib/firestore-lab";
import { createChemistryRoute } from "@/lib/api/create-chemistry-route";

export const GET = createChemistryRoute(
  "experiments",
  getExperimentsFromFirestore,
  "Failed to load chemistry experiments"
);
