/**
 * NCERT Class 7 Science Knowledge Base (2024-25 "Curiosity" Textbook)
 *
 * Contains structured knowledge for all 12 chapters from the new NCERT
 * Class 7 Science textbook for curriculum-aligned AI responses.
 */

import { TopicKnowledge } from "./types";

export const SCIENCE_TOPICS = [
    "The Ever-Evolving World of Science",
    "Exploring Substances: Acidic, Basic, and Neutral",
    "Electricity: Circuits and Their Components",
    "The World of Metals and Non-metals",
    "Changes Around Us: Physical and Chemical",
    "Adolescence: A Stage of Growth and Change",
    "Heat Transfer in Nature",
    "Measurement of Time and Motion",
    "Life Processes in Animals",
    "Life Processes in Plants",
    "Light: Shadows and Reflections",
    "Earth, Moon, and the Sun",
] as const;

export const SCIENCE_KNOWLEDGE: Record<string, TopicKnowledge> = {
    "The Ever-Evolving World of Science": {
        keyConcepts: [
            "Science is a systematic way of understanding nature through observation and experimentation",
            "Scientific knowledge evolves over time as new discoveries are made",
            "The scientific method: Observation → Question → Hypothesis → Experiment → Conclusion",
            "Science helps us understand everyday phenomena",
            "Scientists use tools and technology to make observations and measurements",
            "Science is interconnected - physics, chemistry, biology work together",
        ],
        keyTerms: {
            Science: "Systematic study of nature through observation and experiments",
            Observation: "Carefully watching and noting what happens",
            Hypothesis: "A proposed explanation that can be tested",
            Experiment: "A test to check if a hypothesis is correct",
            Conclusion: "The final decision based on experimental results",
            Technology: "Application of science to solve practical problems",
        },
        textbookExamples: [
            "Understanding why the sky appears blue is science",
            "Galileo's observations of Jupiter's moons changed our understanding of the solar system",
            "Scientists discovered that diseases are caused by germs, not 'bad air'",
            "The discovery of vaccines shows how science evolves to help humanity",
        ],
        commonMisconceptions: [
            "Science has answers to everything - actually science is always evolving and some questions remain unanswered",
            "Scientific theories are just guesses - actually theories are well-tested explanations supported by evidence",
        ],
    },

    "Exploring Substances: Acidic, Basic, and Neutral": {
        keyConcepts: [
            "Substances can be classified as acidic, basic (alkaline), or neutral",
            "Acids taste sour; bases taste bitter and feel slippery",
            "Indicators change color to show if something is acidic or basic",
            "Litmus paper: Red in acid, Blue in base",
            "Neutralization: Acid + Base → Salt + Water",
            "pH scale measures how acidic or basic a substance is (0-14)",
            "pH 7 is neutral; below 7 is acidic; above 7 is basic",
        ],
        keyTerms: {
            Acid: "Substance that tastes sour, turns blue litmus red, pH below 7",
            Base: "Substance that tastes bitter, turns red litmus blue, pH above 7",
            Neutral: "Neither acidic nor basic, pH equals 7",
            Indicator: "Substance that changes color in acids and bases",
            "pH scale": "Scale from 0-14 measuring acidity or basicity",
            Neutralization: "Reaction between acid and base forming salt and water",
            Salt: "Compound formed when acid reacts with base",
        },
        textbookExamples: [
            "Lemon juice, vinegar, orange juice are acidic (sour taste)",
            "Soap, baking soda, lime water are basic",
            "Pure water is neutral (pH 7)",
            "Turmeric turns red in basic solutions - it's a natural indicator",
            "Ant sting (formic acid) is neutralized by baking soda (base)",
            "Our stomach contains hydrochloric acid for digestion",
        ],
        commonMisconceptions: [
            "All acids are dangerous - actually many acids like citric acid in fruits are safe",
            "Neutral means no chemicals - actually water is neutral but still a chemical",
        ],
    },

    "Electricity: Circuits and Their Components": {
        keyConcepts: [
            "Electric current is the flow of electrons through a conductor",
            "A complete circuit is needed for current to flow",
            "Circuit components: cell/battery, wire, switch, bulb, resistor",
            "Conductors allow electricity to pass; insulators do not",
            "Series circuit: components connected one after another",
            "Parallel circuit: components connected across same two points",
            "Symbols are used to draw circuit diagrams",
        ],
        keyTerms: {
            "Electric current": "Flow of electric charges (electrons) through a conductor",
            Circuit: "Complete path for electric current to flow",
            Conductor: "Material that allows electricity to pass (metals, copper wire)",
            Insulator: "Material that blocks electricity (rubber, plastic, wood)",
            "Series circuit": "Circuit where components are in a single path",
            "Parallel circuit": "Circuit where components have multiple paths",
            Switch: "Device to open or close a circuit",
            Cell: "Device that provides electrical energy (battery)",
        },
        textbookExamples: [
            "Copper wire is a good conductor; rubber coating is an insulator",
            "If one bulb breaks in series circuit, all bulbs go off",
            "In parallel circuit, one bulb breaking doesn't affect others",
            "Torch uses series circuit with cells",
            "House wiring uses parallel circuits",
        ],
        commonMisconceptions: [
            "Current gets used up in a bulb - actually current flows through, energy is converted to light/heat",
            "Thick wires carry more current by themselves - actually current depends on voltage and resistance",
        ],
    },

    "The World of Metals and Non-metals": {
        keyConcepts: [
            "Elements are classified as metals and non-metals based on properties",
            "Metals: shiny, conduct heat & electricity, malleable, ductile, sonorous",
            "Non-metals: dull, poor conductors, brittle",
            "Metals react with oxygen to form metal oxides (basic)",
            "Non-metals react with oxygen to form non-metal oxides (acidic)",
            "Metals react with acids to produce hydrogen gas",
            "Reactivity series: some metals are more reactive than others",
        ],
        keyTerms: {
            Metal: "Element that is shiny, conducts electricity, and is malleable",
            "Non-metal": "Element that is usually dull and does not conduct electricity",
            Malleable: "Can be beaten into thin sheets",
            Ductile: "Can be drawn into wires",
            Sonorous: "Produces ringing sound when struck",
            Lustre: "Shiny appearance of metals",
            Corrosion: "Gradual destruction of metals by reaction with environment",
        },
        textbookExamples: [
            "Iron, copper, gold, silver, aluminium are metals",
            "Carbon, sulphur, oxygen, nitrogen are non-metals",
            "Gold is malleable - used for making thin jewelry",
            "Copper is ductile - used for electrical wires",
            "Iron corrodes (rusts) when exposed to air and moisture",
            "Mercury is the only metal that is liquid at room temperature",
        ],
        commonMisconceptions: [
            "All metals are hard - actually sodium is soft enough to cut with knife",
            "All non-metals are gases - actually carbon and sulphur are solid non-metals",
        ],
    },

    "Changes Around Us: Physical and Chemical": {
        keyConcepts: [
            "Physical change: No new substance formed, usually reversible",
            "Chemical change: New substance formed, usually irreversible",
            "Signs of chemical change: color change, gas release, heat/light, precipitate",
            "Rusting is a chemical change (iron + oxygen + water → rust)",
            "Melting, freezing, boiling are physical changes",
            "Burning, cooking, digestion are chemical changes",
        ],
        keyTerms: {
            "Physical change": "Change in form/state without new substance (reversible)",
            "Chemical change": "Change that produces new substance (usually irreversible)",
            Rusting: "Iron combining with oxygen and moisture to form iron oxide",
            Crystallization: "Forming crystals from a solution (physical change)",
            Combustion: "Burning - a chemical reaction with oxygen releasing heat and light",
            Precipitate: "Solid formed when two solutions react",
        },
        textbookExamples: [
            "Melting ice, dissolving sugar, tearing paper - physical changes",
            "Burning wood, cooking food, milk turning to curd - chemical changes",
            "Rusting of iron gate - chemical change",
            "Making salt crystals from salt water - physical change (crystallization)",
            "Digestion of food in stomach - chemical change",
        ],
        commonMisconceptions: [
            "All physical changes are reversible - actually breaking glass is physical but not easily reversible",
            "Chemical changes always need heating - actually rusting happens at room temperature",
        ],
    },

    "Adolescence: A Stage of Growth and Change": {
        keyConcepts: [
            "Adolescence: Period from 11-19 years when body undergoes significant changes",
            "Puberty: Beginning of adolescence when reproductive organs mature",
            "Hormones control the changes during puberty",
            "Secondary sexual characteristics appear during puberty",
            "Growth spurt: Rapid increase in height during adolescence",
            "Emotional changes and mood swings are normal during adolescence",
            "Healthy diet, exercise, and hygiene are important during this period",
        ],
        keyTerms: {
            Adolescence: "Transition period between childhood and adulthood (11-19 years)",
            Puberty: "Age when reproductive organs begin to mature",
            Hormones: "Chemical messengers that control body functions",
            "Growth spurt": "Period of rapid physical growth",
            "Secondary sexual characteristics": "Physical features that develop during puberty",
            Menstruation: "Monthly cycle in females when uterus lining sheds",
            "Adam's apple": "Voice box that becomes prominent in boys during puberty",
        },
        textbookExamples: [
            "Height increases rapidly during teenage years",
            "Voice becomes deeper in boys (voice box grows)",
            "Skin may become oily, leading to pimples",
            "Emotional changes - feeling happy, sad, or confused is normal",
            "Boys develop facial hair; girls develop breasts",
        ],
        commonMisconceptions: [
            "Everyone goes through puberty at the same age - actually timing varies person to person",
            "Only physical changes happen - actually emotional and mental changes also occur",
        ],
    },

    "Heat Transfer in Nature": {
        keyConcepts: [
            "Heat flows from hot objects to cold objects",
            "Three modes of heat transfer: Conduction, Convection, Radiation",
            "Conduction: Heat transfer through solids by particle vibration",
            "Convection: Heat transfer in liquids/gases by movement of particles",
            "Radiation: Heat transfer without any medium (like sun's heat)",
            "Conductors transfer heat easily; insulators do not",
            "Natural phenomena like sea breeze involve convection",
        ],
        keyTerms: {
            Conduction: "Heat transfer through solid without particle movement",
            Convection: "Heat transfer in fluids through particle movement",
            Radiation: "Heat transfer through electromagnetic waves (no medium needed)",
            Conductor: "Material that allows heat to pass easily (metals)",
            Insulator: "Material that resists heat flow (wood, plastic, air)",
            "Sea breeze": "Wind from sea to land during day (convection)",
            "Land breeze": "Wind from land to sea at night (convection)",
        },
        textbookExamples: [
            "Metal spoon becomes hot in tea - conduction",
            "Water in pot heats from bottom up - convection",
            "We feel sun's warmth - radiation through space",
            "Sea breeze during day, land breeze at night",
            "Woolen clothes trap air (insulator) and keep us warm",
            "Black objects absorb more heat than white objects",
        ],
        commonMisconceptions: [
            "Wool produces heat - actually wool traps air which is a poor conductor",
            "Cold flows into our body - actually heat flows out of our body",
        ],
    },

    "Measurement of Time and Motion": {
        keyConcepts: [
            "Motion is change in position over time",
            "Speed = Distance / Time",
            "Units: meters per second (m/s), kilometers per hour (km/h)",
            "Uniform motion: equal distance in equal time intervals",
            "Non-uniform motion: unequal distances in equal time intervals",
            "Simple pendulum oscillates with regular time period",
            "Time period depends on length of pendulum, not its mass",
        ],
        formulas: [
            "Speed = Distance / Time",
            "$v = \\frac{d}{t}$",
            "Distance = Speed × Time",
            "Time = Distance / Speed",
            "1 km/h = 1000m / 3600s = 5/18 m/s",
        ],
        keyTerms: {
            Speed: "Distance covered per unit time",
            "Uniform motion": "Motion with constant speed in same direction",
            "Non-uniform motion": "Motion where speed keeps changing",
            Oscillation: "One complete to-and-fro motion of a pendulum",
            "Time period": "Time for one complete oscillation",
            Speedometer: "Instrument measuring speed of vehicle",
            Odometer: "Instrument measuring total distance traveled",
        },
        textbookExamples: [
            "Car traveling 100 km in 2 hours has speed = 50 km/h",
            "Train moving at constant speed - uniform motion",
            "Vehicle in traffic - non-uniform motion",
            "Pendulum clock uses regular oscillations to measure time",
            "Convert 36 km/h to m/s: 36 × 5/18 = 10 m/s",
        ],
        commonMisconceptions: [
            "Fast things always have high speed - actually speed is relative to observer",
            "Pendulum swings faster with heavier bob - actually time period depends only on length",
        ],
    },

    "Life Processes in Animals": {
        keyConcepts: [
            "Animals need food, oxygen, and removal of waste to survive",
            "Digestion breaks down complex food into simpler substances",
            "Human digestive system: Mouth → Esophagus → Stomach → Intestines",
            "Respiration releases energy from food using oxygen",
            "Blood transports oxygen, nutrients, and waste in the body",
            "Heart pumps blood through arteries and veins",
            "Excretion removes waste products from the body",
        ],
        keyTerms: {
            Digestion: "Breaking down food into absorbable nutrients",
            Respiration: "Process of releasing energy from food",
            Circulation: "Movement of blood through the body",
            Excretion: "Removal of metabolic waste from body",
            Enzymes: "Biological molecules that speed up digestion",
            Villi: "Finger-like projections in intestine for absorption",
            Hemoglobin: "Protein in red blood cells that carries oxygen",
        },
        textbookExamples: [
            "Saliva contains enzymes that start digesting starch in mouth",
            "Stomach acid kills germs and helps digest proteins",
            "Small intestine has villi for better nutrient absorption",
            "Kidneys filter blood and produce urine",
            "Lungs exchange oxygen and carbon dioxide",
        ],
        commonMisconceptions: [
            "Stomach does all digestion - actually digestion starts in mouth and continues in intestines",
            "We breathe to take in oxygen only - actually we also need to remove carbon dioxide",
        ],
    },

    "Life Processes in Plants": {
        keyConcepts: [
            "Plants make their own food through photosynthesis",
            "Photosynthesis needs sunlight, water, CO₂, and chlorophyll",
            "Photosynthesis happens in leaves (chloroplasts)",
            "Plants also respire - they use oxygen and release CO₂",
            "Transpiration: water loss through stomata in leaves",
            "Xylem transports water; Phloem transports food",
            "Plants reproduce through seeds or vegetative parts",
        ],
        formulas: [
            "Photosynthesis: $6CO_2 + 6H_2O \\xrightarrow{\\text{sunlight}} C_6H_{12}O_6 + 6O_2$",
            "Carbon dioxide + Water → Glucose + Oxygen",
        ],
        keyTerms: {
            Photosynthesis: "Process by which plants make food using sunlight",
            Chlorophyll: "Green pigment that captures light energy",
            Stomata: "Tiny pores on leaves for gas exchange",
            Transpiration: "Loss of water vapor from leaves",
            Xylem: "Tissue that transports water from roots to leaves",
            Phloem: "Tissue that transports food from leaves to other parts",
            Germination: "Process when seed starts growing into a plant",
        },
        textbookExamples: [
            "Leaves appear green due to chlorophyll",
            "Plants wilt when they don't get enough water",
            "Cutting a stem shows xylem vessels",
            "Rose can grow from stem cutting (vegetative propagation)",
            "Stomata close at night to prevent water loss",
        ],
        commonMisconceptions: [
            "Plants don't respire - actually plants respire 24/7, photosynthesis only in light",
            "Roots are for feeding only - actually roots mainly absorb water and minerals",
        ],
    },

    "Light: Shadows and Reflections": {
        keyConcepts: [
            "Light travels in straight lines (rectilinear propagation)",
            "Shadows form when opaque objects block light",
            "Reflection: light bouncing off a surface",
            "Laws of reflection: angle of incidence = angle of reflection",
            "Plane mirror forms virtual, erect, same-size image",
            "Convex mirror: curved outward, wider field of view",
            "Concave mirror: curved inward, can magnify",
        ],
        keyTerms: {
            "Rectilinear propagation": "Light traveling in straight lines",
            Shadow: "Dark area formed when opaque object blocks light",
            Reflection: "Bouncing of light from a surface",
            "Incident ray": "Light ray falling on a surface",
            "Reflected ray": "Light ray bouncing off a surface",
            "Plane mirror": "Flat mirror that forms same-size image",
            "Convex mirror": "Mirror curved outward like back of spoon",
            "Concave mirror": "Mirror curved inward like inside of spoon",
        },
        textbookExamples: [
            "We see objects because light reflects from them into our eyes",
            "Shadow of a tree at noon is short; in evening it's long",
            "Rear-view mirrors in vehicles are convex (wider view)",
            "Dentists use concave mirrors to see teeth magnified",
            "Plane mirror in bathroom shows exact reflection",
        ],
        commonMisconceptions: [
            "We see things because our eyes send out light - actually eyes receive light reflected from objects",
            "Mirrors make light - actually mirrors only reflect existing light",
        ],
    },

    "Earth, Moon, and the Sun": {
        keyConcepts: [
            "Earth rotates on its axis (causes day and night)",
            "Earth revolves around the Sun (causes seasons)",
            "Moon revolves around Earth (takes about 27 days)",
            "Moon's phases: New Moon → First Quarter → Full Moon → Last Quarter",
            "Eclipses: Solar (Moon blocks Sun) and Lunar (Earth blocks Sun's light on Moon)",
            "Tides are caused by Moon's gravitational pull on Earth's water",
        ],
        keyTerms: {
            Rotation: "Spinning of Earth on its own axis",
            Revolution: "Earth's movement around the Sun",
            Axis: "Imaginary line through Earth from pole to pole",
            "Lunar eclipse": "Earth's shadow falls on Moon",
            "Solar eclipse": "Moon's shadow falls on Earth",
            Phases: "Different appearances of Moon during a month",
            Tides: "Rise and fall of sea water due to Moon's gravity",
        },
        textbookExamples: [
            "Earth takes 24 hours to rotate once (causes day and night)",
            "Earth takes 365.25 days to revolve around Sun (one year)",
            "Full Moon appears once every 29.5 days",
            "Solar eclipse should NEVER be viewed directly",
            "High tide and low tide occur twice daily",
        ],
        commonMisconceptions: [
            "Moon produces its own light - actually Moon reflects Sun's light",
            "Seasons are caused by Earth's distance from Sun - actually caused by Earth's tilt",
            "Eclipse happens every month - actually orbits are tilted so eclipses are rare",
        ],
    },
};
