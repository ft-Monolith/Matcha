
const COMMON_PASSWORDS = new Set<string>([
  "password", "passw0rd", "motdepasse", "azerty", "qwerty", "qwertyuiop",
  "123456", "12345678", "123456789", "1234567890", "111111", "000000",
  "abc123", "iloveyou", "admin", "root", "welcome", "monkey", "dragon",
  "letmein", "login", "master", "hello", "sunshine", "princess", "football",
  "baseball", "superman", "batman", "trustno1", "starwars", "whatever",
  "matcha", "computer", "internet", "google", "secret", "changeme", "test",
]);


export function isCommonPassword(password: string): boolean {
  return COMMON_PASSWORDS.has(password.toLowerCase());
}
