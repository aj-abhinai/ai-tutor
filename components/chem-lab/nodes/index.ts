/**
 * Node type registry for Chemistry Lab React Flow.
 * Hoisted outside components to prevent re-renders.
 */

import { ChemicalNode } from "./ChemicalNode";
import { BeakerNode } from "./BeakerNode";
import { ProductNode } from "./ProductNode";

export const chemNodeTypes = {
    chemical: ChemicalNode,
    beaker: BeakerNode,
    product: ProductNode,
} as const;
