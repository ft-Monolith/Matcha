import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from "class-validator";
import { PREDEFINED_TAGS } from "../constant/tags";
import { IsValidBirthdate } from "../utils/age_rules";

export const GENDERS = ["man", "woman", "other"] as const;
export type Gender = (typeof GENDERS)[number];

export const SEXUAL_PREFS = ["hetero", "homo", "bi"] as const;
export type SexualPref = (typeof SEXUAL_PREFS)[number];


export interface TagDTO {
  id: string;
  name: string;
}

export interface PictureDTO {
  id: string;
  url: string;
  isProfile: boolean;
}

export interface ProfileDTO {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  gender: Gender | null;
  sexualPref: SexualPref;
  biography: string | null;
  birthdate: string | null;
  tags: TagDTO[];
  pictures: PictureDTO[];
}

export interface MyProfileDTO extends ProfileDTO {
  email: string;
}


export class UpdateProfileDTO {
  @IsOptional()
  @IsIn(GENDERS, { message: "Invalid gender" })
  gender?: Gender;

  @IsOptional()
  @IsIn(SEXUAL_PREFS, { message: "Invalid sexual preference" })
  sexualPref?: SexualPref;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: "Biography is too long" })
  biography?: string;

  @IsOptional()
  @IsDateString({}, { message: "Invalid birthdate" })
  @IsValidBirthdate()
  birthdate?: string;
}

export class UpdateAccountDTO {
  @IsString()
  @Length(1, 50, { message: "Invalid first name" })
  firstName!: string;

  @IsString()
  @Length(1, 50, { message: "Invalid last name" })
  lastName!: string;

  @IsEmail({}, { message: "Invalid email address" })
  email!: string;
}

export class SetTagsDTO {
  @IsArray()
  @ArrayMaxSize(PREDEFINED_TAGS.length)
  @IsIn(PREDEFINED_TAGS, { each: true, message: "Unknown tag" })
  tags!: string[];
}

export class AddPhotoDTO {
  @IsString()
  @Matches(/^data:image\/(jpeg|png|webp);base64,/, { message: "Unsupported image format" })
  data!: string;
}
