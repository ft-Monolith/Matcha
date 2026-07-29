import { IsEmail, IsString, Length, Matches } from "class-validator";
import { IsStrongPassword } from "../utils/pass_rules";

export class RegisterDTO {
  @IsEmail({}, { message: "Invalid email address" })
  email!: string;

  @IsString()
  @Length(3, 20, { message: "Username must be between 3 and 20 characters" })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: "Username may only contain letters, digits and _",
  })
  username!: string;

  @IsString()
  @Length(1, 50, { message: "Invalid last name" })
  last_name!: string;

  @IsString()
  @Length(1, 50, { message: "Invalid first name" })
  first_name!: string;

  @IsStrongPassword()
  password!: string;
}

export class VerifyEmailDTO {
  @IsString()
  @Length(64, 64, { message: "Invalid token" }) 
  token!: string;
}
