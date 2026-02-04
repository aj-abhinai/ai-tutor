/**
 * NCERT Class 7 Maths Knowledge Base (2024-25 Rationalized Syllabus)
 *
 * Contains structured knowledge for all 13 chapters from the NCERT
 * Class 7 Mathematics textbook for curriculum-aligned AI responses.
 */

import { TopicKnowledge } from "./types";

export const MATHS_TOPICS = [
    "Integers",
    "Fractions and Decimals",
    "Data Handling",
    "Simple Equations",
    "Lines and Angles",
    "The Triangle and its Properties",
    "Comparing Quantities",
    "Rational Numbers",
    "Perimeter and Area",
    "Algebraic Expressions",
    "Exponents and Powers",
    "Symmetry",
    "Visualising Solid Shapes",
] as const;

export const MATHS_KNOWLEDGE: Record<string, TopicKnowledge> = {
    Integers: {
        keyConcepts: [
            "Integers include positive numbers, negative numbers, and zero",
            "On number line: right is positive, left is negative",
            "Adding two positive = positive; Adding two negative = negative",
            "Subtracting is same as adding the additive inverse",
            "Multiplying/dividing: same signs = positive, different signs = negative",
            "Any number × 0 = 0; Division by 0 is not defined",
        ],
        formulas: [
            "a - b = a + (-b)",
            "(-a) × (-b) = a × b (positive)",
            "(-a) × b = -(a × b) (negative)",
            "(-a) ÷ (-b) = a ÷ b (positive)",
        ],
        keyTerms: {
            Integers: "Whole numbers and their negatives: ..., -3, -2, -1, 0, 1, 2, 3, ...",
            "Additive inverse": "Number that when added gives zero; -a is inverse of a",
            "Number line": "Line showing numbers in order with zero in middle",
        },
        textbookExamples: [
            "(-3) + (-5) = -8 (adding two negatives)",
            "(-7) - (-4) = (-7) + 4 = -3",
            "(-6) × 4 = -24 (different signs = negative)",
            "(-20) ÷ (-5) = 4 (same signs = positive)",
        ],
        commonMisconceptions: [
            "Negative × negative = negative (WRONG! It equals positive)",
            "Subtracting a negative makes it more negative (WRONG! It adds)",
        ],
    },

    "Fractions and Decimals": {
        keyConcepts: [
            "Fraction = numerator/denominator = part/whole",
            "Proper fraction: numerator < denominator",
            "Improper fraction: numerator ≥ denominator",
            "Multiplying fractions: multiply tops, multiply bottoms",
            "Dividing by a fraction: multiply by its reciprocal",
            "Decimals can be converted to fractions and vice versa",
        ],
        formulas: [
            "$\\frac{a}{b} × \\frac{c}{d} = \\frac{a × c}{b × d}$",
            "$\\frac{a}{b} ÷ \\frac{c}{d} = \\frac{a}{b} × \\frac{d}{c}$",
            "0.5 = 1/2, 0.25 = 1/4, 0.75 = 3/4",
        ],
        keyTerms: {
            Numerator: "Top number in a fraction",
            Denominator: "Bottom number in a fraction",
            Reciprocal: "Fraction flipped (reciprocal of 2/3 is 3/2)",
            "Mixed fraction": "Whole number plus a fraction",
            "Equivalent fractions": "Different fractions with same value (1/2 = 2/4)",
        },
        textbookExamples: [
            "$\\frac{2}{3} × \\frac{4}{5} = \\frac{8}{15}$",
            "$\\frac{3}{4} ÷ \\frac{2}{5} = \\frac{3}{4} × \\frac{5}{2} = \\frac{15}{8}$",
            "0.125 = 125/1000 = 1/8",
            "$2\\frac{1}{2}$ as improper fraction = $\\frac{5}{2}$",
        ],
    },

    "Data Handling": {
        keyConcepts: [
            "Data is collection of information (numbers, facts)",
            "Mean (average) = Sum of all values / Number of values",
            "Mode = Most frequently occurring value",
            "Median = Middle value when arranged in order",
            "Range = Largest value - Smallest value",
            "Bar graphs compare quantities using bars",
            "Probability = Number of favorable outcomes / Total outcomes",
        ],
        formulas: [
            "Mean = $\\frac{\\text{Sum of values}}{\\text{Number of values}}$",
            "Range = Maximum - Minimum",
            "Probability = $\\frac{\\text{Favorable outcomes}}{\\text{Total outcomes}}$",
        ],
        keyTerms: {
            Mean: "Average of all values",
            Median: "Middle value in ordered data",
            Mode: "Value that appears most often",
            Range: "Difference between largest and smallest",
            Probability: "Chance of an event happening (0 to 1)",
            Frequency: "Number of times a value occurs",
        },
        textbookExamples: [
            "For 2, 4, 6, 8, 10: Mean = 30/5 = 6",
            "For 3, 5, 7, 9, 11: Median = 7 (middle value)",
            "For 2, 3, 3, 4, 5, 3: Mode = 3 (appears most)",
            "Probability of getting head in coin toss = 1/2",
        ],
    },

    "Simple Equations": {
        keyConcepts: [
            "Equation has equal sign with unknown variable",
            "Solution is the value that makes equation true",
            "To solve: isolate variable on one side",
            "Whatever you do to one side, do to other side",
            "Transposing: moving term to other side changes sign",
        ],
        formulas: [
            "If a + b = c, then a = c - b",
            "If ax = b, then x = b/a",
        ],
        keyTerms: {
            Variable: "Letter representing unknown number (x, y)",
            Equation: "Statement with equal sign showing two expressions are equal",
            Solution: "Value of variable that makes equation true",
            Transposing: "Moving term from one side to other (sign changes)",
        },
        textbookExamples: [
            "Solve x + 5 = 12: x = 12 - 5 = 7",
            "Solve 3x = 15: x = 15/3 = 5",
            "Solve 2x + 3 = 11: 2x = 8, x = 4",
            "If sum of two numbers is 20 and one is x, other is 20 - x",
        ],
    },

    "Lines and Angles": {
        keyConcepts: [
            "Line extends infinitely in both directions",
            "Ray has one endpoint, extends infinitely one way",
            "Complementary angles add to 90°",
            "Supplementary angles add to 180°",
            "Vertically opposite angles are equal",
            "When transversal crosses parallel lines, alternate angles are equal",
        ],
        formulas: [
            "Complementary: a + b = 90°",
            "Supplementary: a + b = 180°",
            "Vertically opposite angles are equal",
            "Angles on a straight line = 180°",
        ],
        keyTerms: {
            "Complementary angles": "Two angles adding to 90°",
            "Supplementary angles": "Two angles adding to 180°",
            "Adjacent angles": "Angles sharing common vertex and arm",
            "Vertically opposite": "Angles formed opposite when lines cross",
            Transversal: "Line crossing two or more lines",
        },
        textbookExamples: [
            "If one angle is 30°, its complement is 60°",
            "If one angle is 110°, its supplement is 70°",
            "When two lines intersect, opposite angles are equal",
        ],
    },

    "The Triangle and its Properties": {
        keyConcepts: [
            "Sum of angles in a triangle = 180°",
            "Exterior angle = Sum of two interior opposite angles",
            "Types by sides: Equilateral (all equal), Isosceles (two equal), Scalene (none equal)",
            "Types by angles: Acute (all < 90°), Right (one = 90°), Obtuse (one > 90°)",
            "Sum of any two sides > third side",
            "Pythagoras theorem: In right triangle, a² + b² = c²",
        ],
        formulas: [
            "Angle sum = 180°",
            "Exterior angle = Sum of opposite interior angles",
            "Pythagoras: $a^2 + b^2 = c^2$",
        ],
        keyTerms: {
            "Equilateral triangle": "All three sides equal, all angles 60°",
            "Isosceles triangle": "Two sides equal, base angles equal",
            "Scalene triangle": "All sides different",
            "Right triangle": "One angle is 90°",
            Hypotenuse: "Longest side of right triangle (opposite to 90°)",
            Altitude: "Perpendicular from vertex to opposite side",
        },
        textbookExamples: [
            "If two angles are 50° and 60°, third = 180° - 110° = 70°",
            "Right triangle with legs 3, 4: Hypotenuse = √(9+16) = 5",
            "Triangle with sides 3, 4, 8 is NOT possible (3+4 < 8)",
        ],
    },

    "Comparing Quantities": {
        keyConcepts: [
            "Ratio compares two quantities of same unit",
            "Percentage means per hundred (%)",
            "Profit = SP - CP; Loss = CP - SP",
            "Profit% = (Profit/CP) × 100",
            "Simple Interest = (P × R × T) / 100",
            "Amount = Principal + Interest",
        ],
        formulas: [
            "Percentage = (Part/Whole) × 100",
            "Profit % = $\\frac{\\text{Profit}}{\\text{CP}} × 100$",
            "Loss % = $\\frac{\\text{Loss}}{\\text{CP}} × 100$",
            "Simple Interest = $\\frac{P × R × T}{100}$",
        ],
        keyTerms: {
            Ratio: "Comparison by division (3:4)",
            Percentage: "Out of 100",
            "Cost Price (CP)": "Price at which item is bought",
            "Selling Price (SP)": "Price at which item is sold",
            Principal: "Original amount of money",
            "Simple Interest": "Interest on principal only",
        },
        textbookExamples: [
            "CP = ₹100, SP = ₹120: Profit = ₹20, Profit% = 20%",
            "20% of 150 = (20/100) × 150 = 30",
            "SI on ₹1000 at 5% for 2 years = (1000×5×2)/100 = ₹100",
        ],
    },

    "Rational Numbers": {
        keyConcepts: [
            "Rational number = p/q where q ≠ 0",
            "Every integer is a rational number (5 = 5/1)",
            "Rational numbers can be positive, negative, or zero",
            "Equivalent: multiply/divide both numerator and denominator by same number",
            "Standard form: positive denominator, no common factors",
        ],
        formulas: [
            "$\\frac{a}{b} + \\frac{c}{d} = \\frac{ad + bc}{bd}$",
            "$\\frac{a}{b} - \\frac{c}{d} = \\frac{ad - bc}{bd}$",
        ],
        keyTerms: {
            "Rational number": "Number expressed as p/q where q ≠ 0",
            "Standard form": "Lowest terms with positive denominator",
            Equivalent: "Different fractions with same value",
        },
        textbookExamples: [
            "-3/5 and 3/-5 are equivalent to -3/5",
            "Standard form of -4/6 is -2/3",
            "$\\frac{-2}{3} + \\frac{4}{5} = \\frac{-10+12}{15} = \\frac{2}{15}$",
        ],
    },

    "Perimeter and Area": {
        keyConcepts: [
            "Perimeter = total boundary length",
            "Area = space inside a shape",
            "Rectangle: P = 2(l+b), A = l×b",
            "Square: P = 4s, A = s²",
            "Triangle: A = ½ × base × height",
            "Circle: C = 2πr, A = πr²",
        ],
        formulas: [
            "Rectangle: P = $2(l+b)$, A = $l×b$",
            "Square: P = $4s$, A = $s^2$",
            "Triangle: A = $\\frac{1}{2} × b × h$",
            "Circle: C = $2πr$, A = $πr^2$",
            "Parallelogram: A = $b × h$",
        ],
        keyTerms: {
            Perimeter: "Total length of boundary",
            Area: "Space enclosed by a shape",
            Circumference: "Perimeter of a circle",
            Radius: "Distance from center to edge of circle",
            Diameter: "Distance across circle through center (= 2r)",
        },
        textbookExamples: [
            "Rectangle 5×3: P = 16cm, A = 15 sq cm",
            "Circle r=7: C = 2×(22/7)×7 = 44cm",
            "Triangle base=10, height=6: A = ½×10×6 = 30 sq cm",
        ],
    },

    "Algebraic Expressions": {
        keyConcepts: [
            "Expression uses variables, numbers, and operations",
            "Terms are parts separated by + or -",
            "Like terms have same variables with same powers",
            "Add like terms by adding coefficients",
            "Monomial: 1 term; Binomial: 2 terms; Polynomial: many terms",
        ],
        keyTerms: {
            Variable: "Letter representing unknown (x, y)",
            Constant: "Fixed number in expression",
            Coefficient: "Number multiplied with variable",
            Term: "Part separated by + or -",
            "Like terms": "Same variable and power",
        },
        textbookExamples: [
            "In 3x² + 2x - 5: coefficient of x² is 3",
            "3x + 5x = 8x (adding like terms)",
            "(2x + 3) + (4x + 5) = 6x + 8",
        ],
    },

    "Exponents and Powers": {
        keyConcepts: [
            "aⁿ means a multiplied n times",
            "a¹ = a; a⁰ = 1 (when a ≠ 0)",
            "aᵐ × aⁿ = aᵐ⁺ⁿ",
            "aᵐ ÷ aⁿ = aᵐ⁻ⁿ",
            "(aᵐ)ⁿ = aᵐⁿ",
            "Standard form: a × 10ⁿ where 1 ≤ a < 10",
        ],
        formulas: [
            "$a^m × a^n = a^{m+n}$",
            "$a^m ÷ a^n = a^{m-n}$",
            "$(a^m)^n = a^{mn}$",
            "$a^0 = 1$",
        ],
        keyTerms: {
            Exponent: "Number of times to multiply the base",
            Base: "Number being multiplied",
            Power: "Result of base raised to exponent",
            "Standard form": "Scientific notation (a × 10ⁿ)",
        },
        textbookExamples: [
            "$2^3 = 8$",
            "$5^2 × 5^3 = 5^5$",
            "300000000 = $3 × 10^8$",
        ],
    },

    Symmetry: {
        keyConcepts: [
            "Line of symmetry divides figure into identical halves",
            "Regular polygon has as many symmetry lines as sides",
            "Rotational symmetry: looks same when rotated less than 360°",
            "Order = number of times figure looks same in 360° rotation",
            "Circle has infinite lines of symmetry",
        ],
        keyTerms: {
            "Line of symmetry": "Line dividing figure into mirror halves",
            "Rotational symmetry": "Figure looks same after rotation",
            "Order of symmetry": "Positions where figure looks identical in 360°",
        },
        textbookExamples: [
            "Square: 4 lines of symmetry, order 4",
            "Equilateral triangle: 3 lines, order 3",
            "Rectangle: 2 lines of symmetry",
        ],
    },

    "Visualising Solid Shapes": {
        keyConcepts: [
            "3D shapes have length, width, and height",
            "Faces are flat surfaces; Edges where faces meet; Vertices are corners",
            "Euler's formula: F + V - E = 2",
            "Nets are flat patterns that fold into 3D shapes",
            "Views: front, side, top show different perspectives",
        ],
        formulas: ["Euler's formula: F + V - E = 2"],
        keyTerms: {
            Face: "Flat surface of 3D shape",
            Edge: "Line where two faces meet",
            Vertex: "Corner point (plural: vertices)",
            Net: "2D pattern that folds into 3D shape",
        },
        textbookExamples: [
            "Cube: 6 faces, 12 edges, 8 vertices. Check: 6+8-12 = 2 ✓",
            "Pyramid: 5 faces, 8 edges, 5 vertices",
        ],
    },
};
