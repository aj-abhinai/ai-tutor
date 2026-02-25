/**
 * @deprecated Use `@/lib/chemistry/firestore` for chemistry data access.
 * Use `@/lib/physics/firestore` for physics data access.
 *
 * Backward-compatibility shim. Will be removed after import migration.
 */

import "server-only";

export {
  getChemicalFactsFromFirestore,
  getChemicalsFromFirestore,
  getExperimentById,
  getExperimentsFromFirestore,
  getReactionsFromFirestore,
} from "@/lib/chemistry/firestore";

export {
  getPhysicsChapterLabFromFirestore,
  getPhysicsLabChapterIdsFromFirestore,
} from "@/lib/physics/firestore";
