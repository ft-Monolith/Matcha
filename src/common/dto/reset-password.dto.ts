import { IsEmail, IsString, Length } from "class-validator";
import { IsStrongPassword } from "../utils/pass_rules";


export class ForgotPasswordDTO {
  @IsEmail({}, { message: "Invalid email address" })
  email!: string;
}

export class ResetPasswordDTO {
  @IsString()
  @Length(64, 64, { message: "Invalid token" }) 
  token!: string;

  @IsStrongPassword()
  password!: string;
}
