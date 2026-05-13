export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    personal_details:    { bg: "rgba(124,110,248,0.12)", text: "#A89FF8", border: "rgba(124,110,248,0.28)" },
    family:              { bg: "rgba(29,213,163,0.12)",  text: "#1DD5A3", border: "rgba(29,213,163,0.28)" },
    professional_details:{ bg: "rgba(74,158,255,0.12)",  text: "#4A9EFF", border: "rgba(74,158,255,0.28)" },
    sports:              { bg: "rgba(245,166,35,0.12)",  text: "#F5A623", border: "rgba(245,166,35,0.28)" },
    travel:              { bg: "rgba(255,107,107,0.12)", text: "#FF8585", border: "rgba(255,107,107,0.28)" },
    food:                { bg: "rgba(255,159,67,0.12)",  text: "#FF9F43", border: "rgba(255,159,67,0.28)" },
    music:               { bg: "rgba(200,80,192,0.12)",  text: "#D472CC", border: "rgba(200,80,192,0.28)" },
    health:              { bg: "rgba(38,222,129,0.12)",  text: "#26DE81", border: "rgba(38,222,129,0.28)" },
    technology:          { bg: "rgba(69,170,242,0.12)",  text: "#45AAF2", border: "rgba(69,170,242,0.28)" },
    hobbies:             { bg: "rgba(252,92,101,0.12)",  text: "#FC7B83", border: "rgba(252,92,101,0.28)" },
    fashion:             { bg: "rgba(253,121,168,0.12)", text: "#FD79A8", border: "rgba(253,121,168,0.28)" },
    entertainment:       { bg: "rgba(162,155,254,0.12)", text: "#A29BFE", border: "rgba(162,155,254,0.28)" },
    milestones:          { bg: "rgba(255,211,94,0.12)",  text: "#FFD35E", border: "rgba(255,211,94,0.28)" },
    user_preferences:    { bg: "rgba(129,236,236,0.12)", text: "#81ECEC", border: "rgba(129,236,236,0.28)" },
    misc:                { bg: "rgba(150,145,160,0.12)", text: "#9691A0", border: "rgba(150,145,160,0.28)" },
};

const DEFAULT: { bg: string; text: string; border: string } = {
    bg: "rgba(124,110,248,0.10)", text: "#A8B3CF", border: "rgba(124,110,248,0.18)",
};

export function getCategoryColor(cat: string) {
    return CATEGORY_COLORS[cat] ?? DEFAULT;
}
