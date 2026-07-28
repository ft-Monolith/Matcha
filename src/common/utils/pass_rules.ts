import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from "class-validator";
import { isCommonPassword } from "./bad_words";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;


export function checkPasswordStrength(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH)
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`;
  if (password.length > PASSWORD_MAX_LENGTH)
    return `Password is too long (max ${PASSWORD_MAX_LENGTH})`;
  if (!/[a-z]/.test(password)) return "Password must contain a lowercase letter";
  if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain a digit";
  if (!/[^A-Za-z0-9]/.test(password)) return "Password must contain a special character";
  return null;
}

export function IsStrongPassword(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isStrongPassword",
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== "string") return false;
          if (isCommonPassword(value)) return false;
          return checkPasswordStrength(value) === null;
        },
        defaultMessage(args: ValidationArguments): string {
          const value = args.value;
          if (typeof value !== "string") return "Password is required";
          if (isCommonPassword(value)) return "This password is too common";
          return checkPasswordStrength(value) ?? "Invalid password";
        },
      },
    });
  };
}
