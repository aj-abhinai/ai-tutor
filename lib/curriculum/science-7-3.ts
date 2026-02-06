/**
 * Science Class 7 Chapter 3
 */

import { SubjectCurriculum } from "./types";

export const SCIENCE_CHAPTER_3: SubjectCurriculum = {
    subject: "Science",
    chapters: [
        {
            id: "electricity-circuits",
            title: "Electricity: Circuits and Their Components",
            overview: "How electricity is used, how circuits work, and why materials matter.",
            topics: [
                {
                    id: "electricity-everyday",
                    title: "Electricity in Daily Life",
                    overview: "Uses, sources, and safe handling of electricity.",
                    subtopics: [
                        {
                            id: "uses-of-electricity",
                            title: "Uses of Electricity",
                            learningObjectives: [
                                "List common uses of electricity at home, school, and outside",
                                "Group uses into categories like lighting, heating, and communication",
                                "Explain why electricity is important in daily life",
                            ],
                            keyConcepts: [
                                "Electricity helps us do work and save time",
                                "Uses can be grouped by purpose, such as lighting or transport",
                                "A power cut affects many daily activities",
                            ],
                            keyTerms: {
                                Electricity: "A form of energy that powers devices",
                                Appliance: "A device that uses electricity to do a job",
                            },
                            examples: [
                                "Fans, lights, and refrigerators at home",
                                "Mobile phones and the internet for communication",
                                "Electric trains, lifts, and traffic lights",
                            ],
                            misconceptions: [
                                "Electricity is used only for lighting",
                            ],
                            questionBank: [
                                {
                                    id: "uses-q1",
                                    question: "Which is NOT a use of electricity?",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "Lighting a room" },
                                        { label: "B", text: "Cooking in an electric oven" },
                                        { label: "C", text: "Drying clothes in the sun" },
                                        { label: "D", text: "Charging a phone" },
                                    ],
                                    answer: {
                                        correct: "C",
                                        explanation: "Sunlight does not need electricity.",
                                    },
                                },
                                {
                                    id: "uses-q2",
                                    question: "Charging a mobile phone is mainly a use for",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "lighting" },
                                        { label: "B", text: "communication" },
                                        { label: "C", text: "transport" },
                                        { label: "D", text: "cooking" },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "Phones are used for communication.",
                                    },
                                },
                                {
                                    id: "uses-q3",
                                    question: "Which device needs electricity from a wall socket?",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "Battery torch" },
                                        { label: "B", text: "Electric fan" },
                                        { label: "C", text: "Bicycle bell" },
                                        { label: "D", text: "Hand pump" },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "An electric fan works using mains electricity.",
                                    },
                                },
                                {
                                    id: "uses-q4",
                                    question: "Name any two uses of electricity at home.",
                                    type: "short",
                                    answer: {
                                        correct: "Lighting and running fans (or any two valid uses).",
                                        explanation: "Electricity is used for many daily tasks.",
                                    },
                                },
                                {
                                    id: "uses-q5",
                                    question: "Give one example each of lighting and transportation uses of electricity.",
                                    type: "short",
                                    answer: {
                                        correct: "Lighting: bulb or tube light. Transportation: electric train or metro.",
                                        explanation: "Uses can be grouped by purpose.",
                                    },
                                },
                                {
                                    id: "uses-q6",
                                    question: "A town has a power cut at night. Why do many activities stop?",
                                    type: "reasoning",
                                    answer: {
                                        correct: "Many devices need electricity to work, so they stop during a power cut.",
                                        explanation: "Without electricity, circuits cannot run appliances.",
                                    },
                                },
                            ]
                        },
                        {
                            id: "sources-of-electricity",
                            title: "Sources of Electricity",
                            learningObjectives: [
                                "Name common sources like water, wind, sun, and fuels",
                                "Explain that electricity reaches homes through wires",
                                "Distinguish portable sources like cells from mains supply",
                            ],
                            keyConcepts: [
                                "Electricity is generated in different ways",
                                "It reaches homes and factories through transmission wires",
                                "Cells and batteries are portable sources of electricity",
                            ],
                            keyTerms: {
                                "Power station": "A place where electricity is generated",
                                "Transmission lines": "Long wires that carry electricity to cities",
                                "Renewable energy": "Energy from sources like sun or wind that can be used again",
                            },
                            examples: [
                                "Hydroelectric dams generate electricity from falling water",
                                "Solar panels make electricity from sunlight",
                                "Windmills use wind energy",
                            ],
                            misconceptions: [
                                "Electricity is created inside the wires",
                            ],
                            visualCards: [
                                {
                                    id: "hydroelectric-explained",
                                    title: "Hydroelectricity: Step by Step",
                                    imageSrc: "/images/science/electricity/hydroelectric-explained.svg",
                                    caption:
                                        "This diagram shows how flowing water helps make electricity and how that electricity reaches people.",
                                },
                                {
                                    id: "sources-grid-overview",
                                    title: "How Electricity Reaches Us",
                                    imageSrc: "/images/science/electricity/sources-grid-overview.svg",
                                    caption:
                                        "Electricity is generated at power stations and moves through transmission lines to homes and schools.",
                                },
                                {
                                    id: "sources-renewable-and-portable",
                                    title: "Renewable and Portable Sources",
                                    imageSrc: "/images/science/electricity/sources-renewable-portable.svg",
                                    caption:
                                        "Sun and wind are renewable sources, while cells and batteries are portable sources for torches and small devices.",
                                },
                            ],
                            questionBank: [
                                {
                                    id: "sources-q1",
                                    question: "Which is a renewable source of electricity?",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "Coal" },
                                        { label: "B", text: "Sunlight" },
                                        { label: "C", text: "Diesel" },
                                        { label: "D", text: "Petrol" },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "Sunlight can be used again and again.",
                                    },
                                },
                                {
                                    id: "sources-q2",
                                    question: "Electricity reaches our homes mainly through",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "plastic pipes" },
                                        { label: "B", text: "metal wires" },
                                        { label: "C", text: "rubber tubes" },
                                        { label: "D", text: "glass rods" },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "Transmission and home wiring use metal wires.",
                                    },
                                },
                                {
                                    id: "sources-q3",
                                    question: "Which is a portable source of electricity?",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "Power station" },
                                        { label: "B", text: "Solar farm" },
                                        { label: "C", text: "Electric cell" },
                                        { label: "D", text: "Hydroelectric dam" },
                                    ],
                                    answer: {
                                        correct: "C",
                                        explanation: "Cells and batteries are portable sources.",
                                    },
                                },
                                {
                                    id: "sources-q4",
                                    question: "Name one non-renewable source of electricity.",
                                    type: "short",
                                    answer: {
                                        correct: "Coal or natural gas.",
                                        explanation: "These fuels are limited and can be used up.",
                                    },
                                },
                                {
                                    id: "sources-q5",
                                    question: "What is a power station?",
                                    type: "short",
                                    answer: {
                                        correct: "A place where electricity is generated.",
                                        explanation: "Power stations produce electricity for cities.",
                                    },
                                },
                                {
                                    id: "sources-q6",
                                    question: "Why should we use more renewable sources of electricity?",
                                    type: "reasoning",
                                    answer: {
                                        correct: "They can be used again and cause less pollution.",
                                        explanation: "Renewables are cleaner and do not run out quickly.",
                                    },
                                },
                            ]
                        },
                        {
                            id: "electrical-safety",
                            title: "Electrical Safety",
                            learningObjectives: [
                                "Recognize common electrical danger signs",
                                "List safe practices while using electricity",
                                "Explain why insulation is used",
                            ],
                            keyConcepts: [
                                "Electricity can cause shock if handled carelessly",
                                "Insulators like plastic and rubber keep us safe",
                                "Wet hands and damaged wires increase risk",
                            ],
                            keyTerms: {
                                "Electric shock": "Injury caused by current passing through the body",
                                Insulation: "Covering that prevents electric current from passing",
                                "Danger sign": "A warning symbol that electricity can be risky",
                            },
                            examples: [
                                "Plastic covering on wires prevents shocks",
                                "Rubber soles reduce the chance of shocks",
                            ],
                            misconceptions: [
                                "Small shocks are always harmless",
                            ],
                            questionBank: [
                                {
                                    id: "safety-q1",
                                    question: "Which action is safe?",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "Touching a switch with wet hands" },
                                        { label: "B", text: "Using a device with a broken wire" },
                                        { label: "C", text: "Using a plug with dry hands" },
                                        { label: "D", text: "Pulling a plug by the wire" },
                                    ],
                                    answer: {
                                        correct: "C",
                                        explanation: "Dry hands and careful handling are safe.",
                                    },
                                },
                                {
                                    id: "safety-q2",
                                    question: "Wires are covered with plastic because plastic is a",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "conductor" },
                                        { label: "B", text: "battery" },
                                        { label: "C", text: "insulator" },
                                        { label: "D", text: "generator" },
                                    ],
                                    answer: {
                                        correct: "C",
                                        explanation: "Plastic blocks the flow of current.",
                                    },
                                },
                                {
                                    id: "safety-q3",
                                    question: "Which is dangerous?",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "Using a plug with dry hands" },
                                        { label: "B", text: "Touching a switch with wet hands" },
                                        { label: "C", text: "Switching off before cleaning" },
                                        { label: "D", text: "Using insulated wires" },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "Wet hands can let current pass through the body.",
                                    },
                                },
                                {
                                    id: "safety-q4",
                                    question: "Write one rule for electrical safety.",
                                    type: "short",
                                    answer: {
                                        correct: "Do not touch switches with wet hands (or any one rule).",
                                        explanation: "Safety rules reduce the risk of shocks.",
                                    },
                                },
                                {
                                    id: "safety-q5",
                                    question: "Why are wires covered with plastic?",
                                    type: "short",
                                    answer: {
                                        correct: "Plastic is an insulator and prevents electric shocks.",
                                        explanation: "It blocks the flow of current to our hands.",
                                    },
                                },
                                {
                                    id: "safety-q6",
                                    question: "Why are wet hands risky near electricity?",
                                    type: "reasoning",
                                    answer: {
                                        correct: "Water conducts electricity, so current can pass through the body.",
                                        explanation: "This can cause electric shock.",
                                    },
                                },
                            ]
                        },
                    ],
                },
                {
                    id: "torchlight-and-cells",
                    title: "Torchlight and Circuit Parts",
                    overview: "Cells, batteries, lamps, and simple circuits.",
                    subtopics: [
                        {
                            id: "torchlight-components",
                            title: "Torchlight Components",
                            learningObjectives: [
                                "Identify the main parts of a torchlight",
                                "Explain how a torchlight turns on and off",
                            ],
                            keyConcepts: [
                                "A torch has a cell, lamp or LED, switch, and wires",
                                "The switch completes or breaks the circuit",
                            ],
                            keyTerms: {
                                Torch: "A portable light device",
                                Component: "A part of a device",
                            },
                            examples: [
                                "A torch glows when its switch is ON",
                                "Cells are placed inside the torch body",
                            ],
                            misconceptions: [
                                "A torch glows even if the circuit is broken",
                            ],
                            questionBank: [
                                {
                                    id: "torch-q1",
                                    question: "Which part of a torchlight controls ON and OFF?",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "Lamp" },
                                        { label: "B", text: "Switch" },
                                        { label: "C", text: "Cell" },
                                        { label: "D", text: "Cover" },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "The switch opens or closes the circuit.",
                                    },
                                },
                                {
                                    id: "torch-q2",
                                    question: "A torchlight needs a cell mainly to",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "store light" },
                                        { label: "B", text: "provide electrical energy" },
                                        { label: "C", text: "break the circuit" },
                                        { label: "D", text: "change color" },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "The cell supplies electrical energy.",
                                    },
                                },
                                {
                                    id: "torch-q3",
                                    question: "Which part of a torch actually gives light?",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "Switch" },
                                        { label: "B", text: "Lamp or LED" },
                                        { label: "C", text: "Cell" },
                                        { label: "D", text: "Cover" },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "The lamp or LED produces light.",
                                    },
                                },
                                {
                                    id: "torch-q4",
                                    question: "Name any three parts of a torchlight.",
                                    type: "short",
                                    answer: {
                                        correct: "Cell, switch, lamp or LED, and wires (any three).",
                                        explanation: "These parts work together to make light.",
                                    },
                                },
                                {
                                    id: "torch-q5",
                                    question: "What happens inside a torch when the switch is ON?",
                                    type: "short",
                                    answer: {
                                        correct: "The circuit closes and current flows to the lamp.",
                                        explanation: "A closed circuit lets the lamp glow.",
                                    },
                                },
                                {
                                    id: "torch-q6",
                                    question: "Why is a torch useful during a power cut?",
                                    type: "reasoning",
                                    answer: {
                                        correct: "It uses its own cells, so it works without mains power.",
                                        explanation: "Portable sources provide electricity when power is off.",
                                    },
                                },
                            ]
                        },
                        {
                            id: "electric-cell-terminals",
                            title: "Electric Cell and Terminals",
                            learningObjectives: [
                                "Identify the positive and negative terminals of a cell",
                                "Describe the shape of the two terminals",
                                "Explain why a cell is called a portable source",
                            ],
                            keyConcepts: [
                                "A cell has two terminals: positive and negative",
                                "The metal cap is positive and the flat disc is negative",
                                "A cell provides electrical energy",
                            ],
                            keyTerms: {
                                Terminal: "An end of a cell where current enters or leaves",
                                "Positive terminal": "The metal cap side of the cell",
                                "Negative terminal": "The flat disc side of the cell",
                            },
                            examples: [
                                "AA cells have + and - marks",
                                "Cells power clocks and remotes",
                            ],
                            misconceptions: [
                                "Both ends of a cell are the same",
                            ],
                            questionBank: [
                                {
                                    id: "cell-q1",
                                    question: "The positive terminal of a cell is the",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "flat disc" },
                                        { label: "B", text: "metal cap" },
                                        { label: "C", text: "plastic cover" },
                                        { label: "D", text: "middle part" },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "The protruding metal cap is positive.",
                                    },
                                },
                                {
                                    id: "cell-q2",
                                    question: "An electric cell has",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "one terminal" },
                                        { label: "B", text: "two terminals" },
                                        { label: "C", text: "three terminals" },
                                        { label: "D", text: "no terminal" },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "A cell has one positive and one negative terminal.",
                                    },
                                },
                                {
                                    id: "cell-q3",
                                    question: "Which symbol shows the positive terminal of a cell?",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "+" },
                                        { label: "B", text: "-" },
                                        { label: "C", text: "x" },
                                        { label: "D", text: "/" },
                                    ],
                                    answer: {
                                        correct: "A",
                                        explanation: "The plus sign shows the positive terminal.",
                                    },
                                },
                                {
                                    id: "cell-q4",
                                    question: "What is a terminal of a cell?",
                                    type: "short",
                                    answer: {
                                        correct: "An end of a cell where current enters or leaves.",
                                        explanation: "A cell has positive and negative terminals.",
                                    },
                                },
                                {
                                    id: "cell-q5",
                                    question: "Why is a cell called a portable source of electricity?",
                                    type: "short",
                                    answer: {
                                        correct: "It can be carried and used anywhere to supply energy.",
                                        explanation: "Cells are small and easy to carry.",
                                    },
                                },
                                {
                                    id: "cell-q6",
                                    question: "Why should we not connect both terminals of a cell directly?",
                                    type: "reasoning",
                                    answer: {
                                        correct: "It can cause a short circuit and heat the cell quickly.",
                                        explanation: "Current flows too much without a device in between.",
                                    },
                                },
                            ]
                        },
                        {
                            id: "battery-series",
                            title: "Battery and Cell Arrangement",
                            learningObjectives: [
                                "Explain a battery as a combination of cells",
                                "Describe series connection of cells",
                                "Predict what happens if cells are placed wrongly",
                            ],
                            keyConcepts: [
                                "A battery is two or more cells connected together",
                                "The positive terminal of one cell connects to the negative of the next",
                                "Wrong order can stop the bulb from glowing",
                            ],
                            keyTerms: {
                                Battery: "Two or more cells connected to work together",
                                "Series connection": "Cells connected end to end",
                            },
                            examples: [
                                "A torch often uses two cells in series",
                                "A remote may use two cells",
                            ],
                            misconceptions: [
                                "Battery always means only a single cell",
                            ],
                            questionBank: [
                                {
                                    id: "battery-q1",
                                    question: "A battery is made by connecting",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "one cell only" },
                                        { label: "B", text: "two or more cells" },
                                        { label: "C", text: "a bulb and a switch" },
                                        { label: "D", text: "a wire and a bulb" },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "A battery is a group of cells connected together.",
                                    },
                                },
                                {
                                    id: "battery-q2",
                                    question: "In a series connection, the positive terminal of one cell is connected to the",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "positive of the next cell" },
                                        { label: "B", text: "negative of the next cell" },
                                        { label: "C", text: "middle of the next cell" },
                                        { label: "D", text: "bulb glass" },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "Series connection is positive to negative.",
                                    },
                                },
                                {
                                    id: "battery-q3",
                                    question: "A torch uses two cells. If one cell is reversed, the torch will",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "glow brighter" },
                                        { label: "B", text: "not glow" },
                                        { label: "C", text: "always glow" },
                                        { label: "D", text: "make sound" },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "Wrong order can stop current flow.",
                                    },
                                },
                                {
                                    id: "battery-q4",
                                    question: "What is a battery?",
                                    type: "short",
                                    answer: {
                                        correct: "Two or more cells connected to work together.",
                                        explanation: "Cells in a battery act as one source.",
                                    },
                                },
                                {
                                    id: "battery-q5",
                                    question: "Name one device that uses more than one cell.",
                                    type: "short",
                                    answer: {
                                        correct: "Torch or TV remote (any one).",
                                        explanation: "Some devices need more than one cell.",
                                    },
                                },
                                {
                                    id: "battery-q6",
                                    question: "Why do we connect cells in series in a torch?",
                                    type: "reasoning",
                                    answer: {
                                        correct: "To provide more energy or make it work longer.",
                                        explanation: "More cells give a stronger or longer supply.",
                                    },
                                },
                            ]
                        },
                        {
                            id: "lamps-incandescent-led",
                            title: "Incandescent Lamp and LED",
                            learningObjectives: [
                                "Identify the filament in an incandescent lamp",
                                "Explain how an LED is different",
                                "Describe the terminals of an LED",
                            ],
                            keyConcepts: [
                                "A filament glows when current heats it",
                                "An LED has no filament and glows only in one direction",
                                "The longer LED wire is positive and the shorter is negative",
                            ],
                            keyTerms: {
                                Filament: "A thin wire that glows when heated",
                                LED: "Light Emitting Diode that glows with current in one direction",
                            },
                            examples: [
                                "Old torches used filament bulbs",
                                "Many new torches use LEDs",
                            ],
                            misconceptions: [
                                "An LED works in any direction",
                            ],
                            questionBank: [
                                {
                                    id: "lamp-q1",
                                    question: "The filament is found in an",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "LED" },
                                        { label: "B", text: "incandescent lamp" },
                                        { label: "C", text: "battery" },
                                        { label: "D", text: "switch" },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "Filament is the thin wire in an incandescent lamp.",
                                    },
                                },
                                {
                                    id: "lamp-q2",
                                    question: "An LED glows only when",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "connected in any direction" },
                                        { label: "B", text: "connected in the correct direction" },
                                        { label: "C", text: "it is shaken" },
                                        { label: "D", text: "it is heated" },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "LEDs allow current to flow in one direction.",
                                    },
                                },
                                {
                                    id: "lamp-q3",
                                    question: "The longer wire of an LED is",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "negative terminal" },
                                        { label: "B", text: "positive terminal" },
                                        { label: "C", text: "insulator" },
                                        { label: "D", text: "filament" },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "The longer LED wire is the positive terminal.",
                                    },
                                },
                                {
                                    id: "lamp-q4",
                                    question: "Write one difference between an LED and an incandescent lamp.",
                                    type: "short",
                                    answer: {
                                        correct: "LED has no filament and works in one direction; a filament lamp has a filament.",
                                        explanation: "They work differently and have different parts.",
                                    },
                                },
                                {
                                    id: "lamp-q5",
                                    question: "Why does the filament in a bulb glow?",
                                    type: "short",
                                    answer: {
                                        correct: "Current heats the filament and it glows.",
                                        explanation: "The filament becomes hot and emits light.",
                                    },
                                },
                                {
                                    id: "lamp-q6",
                                    question: "Why are LEDs used more in modern torches?",
                                    type: "reasoning",
                                    answer: {
                                        correct: "They use less energy and give bright light.",
                                        explanation: "LEDs are more efficient than filament bulbs.",
                                    },
                                },
                            ]
                        },
                        {
                            id: "making-lamp-glow",
                            title: "Making a Lamp Glow",
                            learningObjectives: [
                                "Make a simple circuit to light a lamp",
                                "Predict which connections will glow",
                                "Explain why a complete path is needed",
                            ],
                            keyConcepts: [
                                "Both terminals of the lamp must connect to the cell terminals",
                                "A complete path is needed for current to flow",
                                "An electrical circuit is a closed loop",
                            ],
                            keyTerms: {
                                Circuit: "A complete path for electric current",
                            },
                            examples: [
                                "A lamp glows when connected correctly to a cell",
                                "A lamp does not glow if one wire is missing",
                            ],
                            misconceptions: [
                                "One wire is enough to make the lamp glow",
                            ],
                            questionBank: [
                                {
                                    id: "glow-q1",
                                    question: "A lamp glows when",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "one terminal touches the cell" },
                                        { label: "B", text: "both terminals are connected to the cell" },
                                        { label: "C", text: "the switch is open" },
                                        { label: "D", text: "the cell is removed" },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "Current flows only when both terminals are connected.",
                                    },
                                },
                                {
                                    id: "glow-q2",
                                    question: "If a wire in the circuit is missing, the lamp will",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "glow brighter" },
                                        { label: "B", text: "glow dim" },
                                        { label: "C", text: "not glow" },
                                        { label: "D", text: "make sound" },
                                    ],
                                    answer: {
                                        correct: "C",
                                        explanation: "The circuit is open so current cannot flow.",
                                    },
                                },
                                {
                                    id: "glow-q3",
                                    question: "When a switch is OFF, the lamp will",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "glow" },
                                        { label: "B", text: "not glow" },
                                        { label: "C", text: "glow brighter" },
                                        { label: "D", text: "make sound" },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "OFF means the circuit is open.",
                                    },
                                },
                                {
                                    id: "glow-q4",
                                    question: "What is an electrical circuit?",
                                    type: "short",
                                    answer: {
                                        correct: "A complete closed path for current to flow.",
                                        explanation: "Current needs a complete loop to move.",
                                    },
                                },
                                {
                                    id: "glow-q5",
                                    question: "What is needed for current to flow in a circuit?",
                                    type: "short",
                                    answer: {
                                        correct: "A complete path with no breaks.",
                                        explanation: "Only a closed circuit allows current to flow.",
                                    },
                                },
                                {
                                    id: "glow-q6",
                                    question: "Why does a lamp glow when the circuit is closed?",
                                    type: "reasoning",
                                    answer: {
                                        correct: "Current flows through the lamp and makes it glow.",
                                        explanation: "A closed circuit lets current pass through the lamp.",
                                    },
                                },
                            ]
                        },
                        {
                            id: "conductors-insulators",
                            title: "Conductors and Insulators",
                            learningObjectives: [
                                "Classify materials as conductors or insulators",
                                "Give examples of each",
                                "Explain why wires are covered",
                            ],
                            keyConcepts: [
                                "Conductors allow current to flow",
                                "Insulators block current",
                                "Metals are good conductors",
                            ],
                            keyTerms: {
                                Conductor: "Material that allows current to pass",
                                Insulator: "Material that blocks current",
                                Tester: "A simple circuit used to test materials",
                            },
                            examples: [
                                "Copper wires carry current in circuits",
                                "Plastic covering on wires prevents shocks",
                            ],
                            misconceptions: [
                                "All shiny materials are conductors",
                            ],
                            questionBank: [
                                {
                                    id: "conductors-q1",
                                    question: "Which material is a good conductor?",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "Copper" },
                                        { label: "B", text: "Rubber" },
                                        { label: "C", text: "Wood" },
                                        { label: "D", text: "Plastic" },
                                    ],
                                    answer: {
                                        correct: "A",
                                        explanation: "Copper is a metal and conducts electricity.",
                                    },
                                },
                                {
                                    id: "conductors-q2",
                                    question: "Why are wires covered with plastic?",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "To make them heavier" },
                                        { label: "B", text: "To prevent shocks" },
                                        { label: "C", text: "To make them shiny" },
                                        { label: "D", text: "To stop the battery" },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "Plastic is an insulator and keeps us safe.",
                                    },
                                },
                                {
                                    id: "conductors-q3",
                                    question: "Which of these is an insulator?",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "Iron nail" },
                                        { label: "B", text: "Copper wire" },
                                        { label: "C", text: "Rubber eraser" },
                                        { label: "D", text: "Steel spoon" },
                                    ],
                                    answer: {
                                        correct: "C",
                                        explanation: "Rubber does not allow current to pass.",
                                    },
                                },
                                {
                                    id: "conductors-q4",
                                    question: "What is a conductor?",
                                    type: "short",
                                    answer: {
                                        correct: "A material that allows electric current to pass.",
                                        explanation: "Metals are common conductors.",
                                    },
                                },
                                {
                                    id: "conductors-q5",
                                    question: "Give two examples of insulators.",
                                    type: "short",
                                    answer: {
                                        correct: "Plastic and rubber (or wood).",
                                        explanation: "Insulators block the flow of current.",
                                    },
                                },
                                {
                                    id: "conductors-q6",
                                    question: "Why are metal wires covered with plastic?",
                                    type: "reasoning",
                                    answer: {
                                        correct: "Metal carries current but plastic blocks it and prevents shocks.",
                                        explanation: "Conductors carry electricity; insulators keep us safe.",
                                    },
                                },
                            ]
                        },
                    ],
                },
                {
                    id: "circuits-and-switches",
                    title: "Circuits, Switches, and Diagrams",
                    overview: "Open and closed circuits, switches, and circuit diagrams.",
                    subtopics: [
                        {
                            id: "closed-open-circuits",
                            title: "Closed and Open Circuits",
                            learningObjectives: [
                                "Define closed and open circuits",
                                "Explain why a bulb glows only in a closed circuit",
                                "Identify breaks that make a circuit open",
                            ],
                            keyConcepts: [
                                "A circuit is a complete path for current",
                                "A closed circuit lets current flow",
                                "An open circuit breaks the path",
                            ],
                            keyTerms: {
                                Circuit: "A complete path for electric current",
                                "Closed circuit": "A complete, unbroken path",
                                "Open circuit": "A broken path where current cannot flow",
                            },
                            examples: [
                                "A torch glows when its switch is ON",
                                "A doorbell works only when the circuit is complete",
                            ],
                            misconceptions: [
                                "A bulb can glow even if the circuit has a break",
                            ],
                            questionBank: [
                                {
                                    id: "closed-open-q1",
                                    question: "A bulb glows only when the circuit is",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "open" },
                                        { label: "B", text: "closed" },
                                        { label: "C", text: "broken" },
                                        { label: "D", text: "without wires" },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "Current flows only in a closed circuit.",
                                    },
                                },
                                {
                                    id: "closed-open-q2",
                                    question: "Which action makes a circuit open?",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "Connecting the switch" },
                                        { label: "B", text: "Removing a wire" },
                                        { label: "C", text: "Using a battery" },
                                        { label: "D", text: "Using a bulb" },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "Removing a wire breaks the path.",
                                    },
                                },
                                {
                                    id: "closed-open-q3",
                                    question: "A switch in OFF position makes the circuit",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "closed" },
                                        { label: "B", text: "open" },
                                        { label: "C", text: "brighter" },
                                        { label: "D", text: "faster" },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "OFF means the circuit is open.",
                                    },
                                },
                                {
                                    id: "closed-open-q4",
                                    question: "What is a closed circuit?",
                                    type: "short",
                                    answer: {
                                        correct: "A complete, unbroken path for current to flow.",
                                        explanation: "Current needs a complete loop to move.",
                                    },
                                },
                                {
                                    id: "closed-open-q5",
                                    question: "What is an open circuit?",
                                    type: "short",
                                    answer: {
                                        correct: "A broken path where current cannot flow.",
                                        explanation: "A gap stops the flow of current.",
                                    },
                                },
                                {
                                    id: "closed-open-q6",
                                    question: "Why does a bulb stop glowing when the circuit is open?",
                                    type: "reasoning",
                                    answer: {
                                        correct: "The path breaks so current cannot reach the bulb.",
                                        explanation: "No current means no glow.",
                                    },
                                },
                            ]
                        },
                        {
                            id: "electric-switch",
                            title: "Electric Switch",
                            learningObjectives: [
                                "Describe how a switch controls current",
                                "Explain ON and OFF positions",
                                "Make a simple switch using safe materials",
                            ],
                            keyConcepts: [
                                "A switch completes or breaks a circuit",
                                "OFF means open circuit and ON means closed circuit",
                                "A switch can be placed anywhere in a circuit",
                            ],
                            keyTerms: {
                                Switch: "A device that opens or closes a circuit",
                                "OFF position": "Circuit is open and current does not flow",
                                "ON position": "Circuit is closed and current flows",
                            },
                            examples: [
                                "Room lights turn on when the switch closes the circuit",
                                "Torch switches work the same way",
                            ],
                            misconceptions: [
                                "A switch must be placed near the bulb",
                            ],
                            questionBank: [
                                {
                                    id: "switch-q1",
                                    question: "A switch in OFF position makes the circuit",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "closed" },
                                        { label: "B", text: "open" },
                                        { label: "C", text: "short" },
                                        { label: "D", text: "brighter" },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "OFF means the circuit is open.",
                                    },
                                },
                                {
                                    id: "switch-q2",
                                    question: "A switch can be placed",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "only near the bulb" },
                                        { label: "B", text: "anywhere in the circuit" },
                                        { label: "C", text: "only near the cell" },
                                        { label: "D", text: "outside the circuit" },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "A switch can be placed anywhere in the circuit.",
                                    },
                                },
                                {
                                    id: "switch-q3",
                                    question: "When a switch is closed, the circuit is",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "open" },
                                        { label: "B", text: "closed" },
                                        { label: "C", text: "broken" },
                                        { label: "D", text: "unused" },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "Closed switch completes the circuit.",
                                    },
                                },
                                {
                                    id: "switch-q4",
                                    question: "What is the main job of a switch?",
                                    type: "short",
                                    answer: {
                                        correct: "To open or close the circuit and control current.",
                                        explanation: "It lets us turn devices ON or OFF.",
                                    },
                                },
                                {
                                    id: "switch-q5",
                                    question: "What is the difference between ON and OFF positions?",
                                    type: "short",
                                    answer: {
                                        correct: "ON closes the circuit; OFF opens it.",
                                        explanation: "Current flows only in the ON position.",
                                    },
                                },
                                {
                                    id: "switch-q6",
                                    question: "Why are switches important for safety?",
                                    type: "reasoning",
                                    answer: {
                                        correct: "They let us control current without touching wires.",
                                        explanation: "Switches reduce the risk of electric shocks.",
                                    },
                                },
                            ]
                        },
                        {
                            id: "current-direction",
                            title: "Direction of Current",
                            learningObjectives: [
                                "State the conventional direction of electric current",
                                "Connect this idea to LED polarity",
                            ],
                            keyConcepts: [
                                "Current direction is taken from positive to negative terminal",
                                "An LED glows only when current flows in the correct direction",
                            ],
                            keyTerms: {
                                "Electric current": "Flow of electric charge in a circuit",
                                "Direction of current": "From positive to negative terminal in diagrams",
                            },
                            examples: [
                                "LED glows when its longer wire is connected to the positive terminal",
                            ],
                            misconceptions: [
                                "Current flows only from negative to positive in simple circuits",
                            ],
                            questionBank: [
                                {
                                    id: "current-q1",
                                    question: "The direction of current in a circuit is taken from",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "negative to positive terminal" },
                                        { label: "B", text: "positive to negative terminal" },
                                        { label: "C", text: "bulb to switch" },
                                        { label: "D", text: "wire to battery cover" },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "By convention, current is from positive to negative.",
                                    },
                                },
                                {
                                    id: "current-q2",
                                    question: "The longer wire of an LED should be connected to the",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "negative terminal of the cell" },
                                        { label: "B", text: "positive terminal of the cell" },
                                        { label: "C", text: "switch only" },
                                        { label: "D", text: "bulb glass" },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "The longer LED wire is the positive terminal.",
                                    },
                                },
                                {
                                    id: "current-q3",
                                    question: "A torch with an LED does not glow even though the cells are new. The most likely reason is",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "the LED is connected in reverse" },
                                        { label: "B", text: "the LED needs sunlight" },
                                        { label: "C", text: "the LED is made of plastic" },
                                        { label: "D", text: "the switch is always ON" },
                                    ],
                                    answer: {
                                        correct: "A",
                                        explanation: "An LED glows only when current flows in the correct direction.",
                                    },
                                },
                                {
                                    id: "current-q4",
                                    question: "What does the conventional direction of current mean?",
                                    type: "short",
                                    answer: {
                                        correct: "It means we show current from the positive to the negative terminal.",
                                        explanation: "This is the standard direction used in diagrams.",
                                    },
                                },
                                {
                                    id: "current-q5",
                                    question: "Why does an LED glow only in one direction?",
                                    type: "short",
                                    answer: {
                                        correct: "Because current can pass through an LED only one way.",
                                        explanation: "LEDs allow current in one direction only.",
                                    },
                                },
                                {
                                    id: "current-q6",
                                    question: "A torch bulb glows even if the cell is reversed, but an LED torch does not. Explain why.",
                                    type: "reasoning",
                                    answer: {
                                        correct: "A filament bulb works in either direction, but an LED allows current only one way.",
                                        explanation: "LEDs are one-way devices, so polarity matters for them.",
                                    },
                                },
                            ]
                        },
                        {
                            id: "circuit-symbols-diagrams",
                            title: "Circuit Symbols and Diagrams",
                            learningObjectives: [
                                "Recognize symbols for cell, bulb, switch, and wire",
                                "Explain why circuit diagrams are useful",
                                "Draw a simple circuit diagram",
                            ],
                            keyConcepts: [
                                "Symbols are simple signs for components",
                                "Circuit diagrams show how parts connect",
                                "Diagrams make communication easy",
                            ],
                            keyTerms: {
                                Symbol: "A simple sign used to show a component",
                                "Circuit diagram": "A drawing using symbols to show a circuit",
                            },
                            examples: [
                                "A torch circuit can be drawn with symbols",
                                "A cell is shown by two unequal lines",
                            ],
                            misconceptions: [
                                "We must draw real pictures instead of symbols",
                            ],
                            questionBank: [
                                {
                                    id: "symbols-q1",
                                    question: "Which symbol usually represents a cell?",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "Two unequal parallel lines" },
                                        { label: "B", text: "A circle with a cross" },
                                        { label: "C", text: "A zigzag line" },
                                        { label: "D", text: "A triangle" },
                                    ],
                                    answer: {
                                        correct: "A",
                                        explanation: "A cell is drawn as two unequal lines.",
                                    },
                                },
                                {
                                    id: "symbols-q2",
                                    question: "A circuit diagram is drawn using",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "real pictures" },
                                        { label: "B", text: "standard symbols" },
                                        { label: "C", text: "only colors" },
                                        { label: "D", text: "only words" },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "Circuit diagrams use standard symbols.",
                                    },
                                },
                                {
                                    id: "symbols-q3",
                                    question: "Which symbol is commonly used for a bulb in a circuit diagram?",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "A circle with a cross" },
                                        { label: "B", text: "Two unequal lines" },
                                        { label: "C", text: "A triangle" },
                                        { label: "D", text: "A rectangle" },
                                    ],
                                    answer: {
                                        correct: "A",
                                        explanation: "A bulb is often shown as a circle with a cross.",
                                    },
                                },
                                {
                                    id: "symbols-q4",
                                    question: "Why are circuit symbols useful?",
                                    type: "short",
                                    answer: {
                                        correct: "They make diagrams clear and quick to draw.",
                                        explanation: "Symbols are a short, clear way to show parts.",
                                    },
                                },
                                {
                                    id: "symbols-q5",
                                    question: "Name two components shown in circuit diagrams.",
                                    type: "short",
                                    answer: {
                                        correct: "Cell and bulb (or switch and wires).",
                                        explanation: "Common symbols include cell, bulb, and switch.",
                                    },
                                },
                                {
                                    id: "symbols-q6",
                                    question: "Why are standard symbols used all over the world?",
                                    type: "reasoning",
                                    answer: {
                                        correct: "So people everywhere can understand the same diagram.",
                                        explanation: "Standard symbols make communication easy.",
                                    },
                                },
                            ]
                        },
                        {
                            id: "troubleshooting-circuits",
                            title: "Troubleshooting Circuits",
                            learningObjectives: [
                                "List reasons a lamp may not glow",
                                "Suggest steps to find the fault",
                            ],
                            keyConcepts: [
                                "Common faults include dead cells and broken filaments",
                                "Loose connections can open the circuit",
                                "LEDs must be connected in the correct direction",
                            ],
                            keyTerms: {
                                Fused: "A filament broken so the bulb cannot glow",
                                Fault: "A problem in a circuit that stops current",
                            },
                            examples: [
                                "A lamp does not glow even after closing the switch",
                            ],
                            misconceptions: [
                                "If a lamp does not glow, only the switch is faulty",
                            ],
                            questionBank: [
                                {
                                    id: "fault-q1",
                                    question: "A lamp may not glow because",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "the filament is broken" },
                                        { label: "B", text: "the battery is working well" },
                                        { label: "C", text: "the circuit is closed" },
                                        { label: "D", text: "the wires are connected correctly" },
                                    ],
                                    answer: {
                                        correct: "A",
                                        explanation: "A broken filament stops current.",
                                    },
                                },
                                {
                                    id: "fault-q2",
                                    question: "If an LED is connected in reverse direction, it will",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "glow brightly" },
                                        { label: "B", text: "not glow" },
                                        { label: "C", text: "make a sound" },
                                        { label: "D", text: "heat the cell" },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "Current cannot pass through an LED in reverse.",
                                    },
                                },
                                {
                                    id: "fault-q3",
                                    question: "A torch stops working. The most likely cause is",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "dead cells" },
                                        { label: "B", text: "extra light" },
                                        { label: "C", text: "too much air" },
                                        { label: "D", text: "the wire is shiny" },
                                    ],
                                    answer: {
                                        correct: "A",
                                        explanation: "Dead cells cannot supply energy.",
                                    },
                                },
                                {
                                    id: "fault-q4",
                                    question: "Give two possible reasons why a lamp does not glow.",
                                    type: "short",
                                    answer: {
                                        correct: "Dead cell, loose wire, or broken filament (any two).",
                                        explanation: "A fault in any part can open the circuit.",
                                    },
                                },
                                {
                                    id: "fault-q5",
                                    question: "What is one simple thing to check first in a faulty circuit?",
                                    type: "short",
                                    answer: {
                                        correct: "Check the cell and connections.",
                                        explanation: "Loose or dead parts are common faults.",
                                    },
                                },
                                {
                                    id: "fault-q6",
                                    question: "How can you find the fault in a circuit step by step?",
                                    type: "reasoning",
                                    answer: {
                                        correct: "Check the cell, then wires, then the bulb or LED.",
                                        explanation: "Testing each part helps locate the problem.",
                                    },
                                },
                            ]
                        },
                    ],
                },
            ],
        },
    ],
};
