import type { Gender, SexualPref } from "@common/dto/profile.dto";

export const GENDER_LABEL: Record<Gender, string> = {
  man: "Man",
  woman: "Woman",
  other: "Other",
};

export const PREF_LABEL: Record<SexualPref, string> = {
  hetero: "Heterosexual",
  homo: "Homosexual",
  bi: "Bisexual",
};
