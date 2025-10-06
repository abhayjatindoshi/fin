import { createLucideIcon, type IconNode } from "lucide-react"

const __iconNode: IconNode = [
    // Arc 1 (Red → Yellow)
    [
        "path",
        {
            d: "M17.785 5.106A9 9 0 0 0 3.542 8.922",
            stroke: "url(#g-seg1)",
            strokeWidth: "4",
            fill: "none",
            strokeLinecap: "round",
            strokeLinejoin: "round",
        },
    ],
    // Arc 2 (Yellow → Green)
    [
        "path",
        {
            d: "M3.542 8.922A9 9 0 0 0 5.776 18.5",
            stroke: "url(#g-seg2)",
            strokeWidth: "4",
            fill: "none",
            strokeLinecap: "round",
            strokeLinejoin: "round",
        },
    ],
    // Arc 3 (Green → Green)
    [
        "path",
        {
            d: "M5.776 18.5A9 9 0 0 0 10.438 20.863",
            stroke: "url(#g-seg3)",
            strokeWidth: "4",
            fill: "none",
            strokeLinecap: "round",
            strokeLinejoin: "round",
        },
    ],
    // Arc 4 (Green → Blue)
    [
        "path",
        {
            d: "M10.438 20.863A9 9 0 0 0 21 12",
            stroke: "url(#g-seg4)",
            strokeWidth: "4",
            fill: "none",
            strokeLinecap: "round",
            strokeLinejoin: "round",
        },
    ],
    // Crossbar (Blue)
    [
        "path",
        {
            d: "M13 12h8",
            stroke: "url(#g-cross)",
            strokeWidth: "4",
            fill: "none",
            strokeLinecap: "round",
            strokeLinejoin: "round",
        },
    ],
    // Gradients definitions as invisible "paths" to embed in Lucide
    [
        "defs",
        {
            children: [
                [
                    "linearGradient",
                    {
                        id: "g-seg1",
                        x1: "17.785",
                        y1: "5.106",
                        x2: "3.542",
                        y2: "8.922",
                        gradientUnits: "userSpaceOnUse",
                        children: [
                            ["stop", { offset: "0%", stopColor: "#EA4335" }],
                            ["stop", { offset: "55%", stopColor: "#EA4335" }],
                            ["stop", { offset: "90%", stopColor: "#FBBC04" }],
                            ["stop", { offset: "100%", stopColor: "#FBBC04" }],
                        ],
                    },
                ],
                [
                    "linearGradient",
                    {
                        id: "g-seg2",
                        x1: "3.542",
                        y1: "8.922",
                        x2: "5.776",
                        y2: "18.5",
                        gradientUnits: "userSpaceOnUse",
                        children: [
                            ["stop", { offset: "0%", stopColor: "#FBBC04" }],
                            ["stop", { offset: "40%", stopColor: "#FBBC04" }],
                            ["stop", { offset: "90%", stopColor: "#34A853" }],
                            ["stop", { offset: "100%", stopColor: "#34A853" }],
                        ],
                    },
                ],
                [
                    "linearGradient",
                    {
                        id: "g-seg3",
                        x1: "5.776",
                        y1: "18.5",
                        x2: "10.438",
                        y2: "20.863",
                        gradientUnits: "userSpaceOnUse",
                        children: [["stop", { offset: "0%", stopColor: "#34A853" }], ["stop", { offset: "100%", stopColor: "#34A853" }]],
                    },
                ],
                [
                    "linearGradient",
                    {
                        id: "g-seg4",
                        x1: "10.438",
                        y1: "20.863",
                        x2: "21",
                        y2: "12",
                        gradientUnits: "userSpaceOnUse",
                        children: [["stop", { offset: "0%", stopColor: "#34A853" }], ["stop", { offset: "100%", stopColor: "#4285F4" }]],
                    },
                ],
                [
                    "linearGradient",
                    {
                        id: "g-cross",
                        x1: "12",
                        y1: "12",
                        x2: "21",
                        y2: "12",
                        gradientUnits: "userSpaceOnUse",
                        children: [["stop", { offset: "0%", stopColor: "#4285F4" }], ["stop", { offset: "100%", stopColor: "#4285F4" }]],
                    },
                ],
            ],
        },
    ],
]

export const Google = createLucideIcon("Google", __iconNode)
