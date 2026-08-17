export const GENDERS = ["man", "woman", "other"] as const;
export type Gender = (typeof GENDERS)[number];

export const SEXUAL_PREFS = ["hetero", "homo", "bi"] as const;
export type SexualPref = (typeof SEXUAL_PREFS)[number];
