import type { Gender, SexualPref } from "@common/dto/profile.dto";

export interface ProfileEntity {
  user_id: string;
  gender: Gender | null;
  sexual_pref: SexualPref;
  biography: string | null;
  birthdate: Date | null;
  created_at: Date;
  updated_at: Date;
}
