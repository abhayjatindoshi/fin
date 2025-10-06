import { createLucideIcon, type IconNode } from "lucide-react"

const __iconNode: IconNode = [
    // Left rhombus (left arm)
    ["polygon", { points: "12,2 2,20 7,20 17,2" }],
    // Right rhombus (right arm)
    ["polygon", { points: "12,2 17,2 22,20 12,20" }],
    // Bottom rhombus (bottom arm)
    ["polygon", { points: "2,20 12,20 22,20 12,22" }]
]

export const GoogleDrive = createLucideIcon("GoogleDrive", __iconNode)
