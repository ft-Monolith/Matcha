import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from "class-validator";
import { isCommonPassword } from "./bad_words";
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  checkPasswordStrength,
} from "./password_strength";

export { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH, checkPasswordStrength };

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
