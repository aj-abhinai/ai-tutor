import { getExperimentsFromFirestore } from "@/lib/chemistry/firestore";
import { createChemistryRoute } from "@/lib/api/create-chemistry-route";

export const GET = createChemistryRoute(
  "experiments",
  getExperimentsFromFirestore,
  "Failed to load chemistry experiments"
);
