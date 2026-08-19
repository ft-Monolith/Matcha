import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from "class-validator";

export const MIN_AGE = 18;
export const MAX_AGE = 100;

function computeAge(birth: Date, ref: Date): number {
  let age = ref.getFullYear() - birth.getFullYear();
  const monthDiff = ref.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < birth.getDate()))
    age--;
  return age;
}

export function checkBirthdate(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid birthdate";

  const now = new Date();
  if (date > now) return "Birthdate cannot be in the future";

  const age = computeAge(date, now);
  if (age < MIN_AGE) return `You must be at least ${MIN_AGE} years old`;
  if (age > MAX_AGE) return "Invalid birthdate";

  return null;
}

export function IsValidBirthdate(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isValidBirthdate",
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate(value: unknown): boolean {
          return typeof value === "string" && checkBirthdate(value) === null;
        },
        defaultMessage(args: ValidationArguments): string {
          return typeof args.value === "string"
            ? (checkBirthdate(args.value) ?? "Invalid birthdate")
            : "Invalid birthdate";
        },
      },
    });
  };
}
