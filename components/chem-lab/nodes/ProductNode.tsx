"use client";

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

function ProductNodeComponent({ data, selected }: NodeProps) {
    const products = String(data.products ?? "");
    const equation = String(data.equation ?? "");
    const category = String(data.category ?? "");
    const resultColor = String(data.resultColor ?? "#cbd5e1");
    const gasReleased = Boolean(data.gasReleased);
    const colorChange = Boolean(data.colorChange);
    const precipitate = Boolean(data.precipitate);
    const heat = String(data.heat ?? "none");

    return (
        <div className={`rf-product-node${selected ? " selected" : ""}`}>
            {/* Input handle from beaker */}
            <Handle
                type="target"
                position={Position.Left}
                id="product-in"
                className="rf-chem-handle"
                title="From reaction"
            />

            {/* Colour swatch */}
            <div className="rf-product-swatch" style={{ backgroundColor: resultColor }} />

            {/* Product info */}
            <div className="rf-product-info">
                <span className="rf-product-title">Products</span>
                <span className="rf-product-name">{products}</span>
                <span className="rf-product-equation">{equation}</span>
                {category && <span className="rf-product-category">{category}</span>}
            </div>

            {/* Observation badges */}
            <div className="rf-product-badges">
                {gasReleased && <span className="rf-badge rf-badge-gas">💨 Gas</span>}
                {colorChange && <span className="rf-badge rf-badge-color">🎨 Colour</span>}
                {precipitate && <span className="rf-badge rf-badge-precip">⬇️ Precipitate</span>}
                {heat === "exothermic" && <span className="rf-badge rf-badge-heat">🔥 Exothermic</span>}
                {heat === "endothermic" && <span className="rf-badge rf-badge-cold">❄️ Endothermic</span>}
            </div>
        </div>
    );
}

export const ProductNode = memo(ProductNodeComponent);
