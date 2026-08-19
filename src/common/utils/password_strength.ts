// Module PUR (aucun import class-validator) : réutilisable côté front sans risque.

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

/** Retourne le premier problème de force du mot de passe, ou null si OK. */
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
