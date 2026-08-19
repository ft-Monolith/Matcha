import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { PREDEFINED_TAGS, MAX_TAGS } from "../constant/tags";
import { IsValidBirthdate } from "../utils/age_rules";
import { GENDERS, SEXUAL_PREFS, type Gender, type SexualPref } from "../constant/profile";

export { GENDERS, SEXUAL_PREFS };
export type { Gender, SexualPref };


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
  city: string | null;
  tags: TagDTO[];
  pictures: PictureDTO[];
  online: boolean;
  lastSeen: string | null;
  likedByMe: boolean;
  likesMe: boolean;
  fame: number;
  distance: number | null;
}

export interface ProfilePreviewDTO {
  userId: string;
  firstName: string;
  age: number | null;
  photo: string | null;
  online: boolean;
  fame: number;
  distance: number | null;
}

export interface MyProfileDTO extends ProfileDTO {
  email: string;
  latitude: number | null;
  longitude: number | null;
  locationConsent: boolean;
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
  @ArrayMaxSize(MAX_TAGS, { message: `You can select up to ${MAX_TAGS} tags` })
  @IsIn(PREDEFINED_TAGS, { each: true, message: "Unknown tag" })
  tags!: string[];
}

export class AddPhotoDTO {
  @IsString()
  @Matches(/^data:image\/(jpeg|png|webp);base64,/, { message: "Unsupported image format" })
  data!: string;
}

export class UpdateLocationDTO {
  @IsOptional()
  @IsNumber({}, { message: "Invalid latitude" })
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber({}, { message: "Invalid longitude" })
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120, { message: "City name is too long" })
  city?: string;

  @IsOptional()
  @IsBoolean()
  consent?: boolean;
}
