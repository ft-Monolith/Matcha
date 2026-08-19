import { useState, type ReactNode } from "react";
import { API } from "@web/API/api";
import { $user } from "@web/observables/observables";
import { loadingWrapper } from "@web/utils/loadingWrapper";
import { checkPasswordStrength } from "@common/utils/password_strength";
import { isCommonPassword } from "@common/utils/bad_words";
import { Button } from "@shadcn/ui/button";
import { Input } from "@shadcn/ui/input";

type Mode = "login" | "register" | "forgot-password";
type Errors = Record<string, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_]+$/;

interface Fields {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  passwordConfirm: string;
}

function validate(mode: Mode, f: Fields): Errors {
  const e: Errors = {};

  if (mode === "register") {
    if (!f.firstName.trim()) e.firstName = "First name is required.";
    else if (f.firstName.length > 50) e.firstName = "First name is too long (max 50).";
    if (!f.lastName.trim()) e.lastName = "Last name is required.";
    else if (f.lastName.length > 50) e.lastName = "Last name is too long (max 50).";
  }

  if (mode === "register" || mode === "forgot-password") {
    if (!f.email.trim()) e.email = "Email is required.";
    else if (!EMAIL_RE.test(f.email)) e.email = "Enter a valid email address.";
  }

  if (mode === "login" || mode === "register") {
    if (!f.username.trim()) e.username = "Username is required.";
    else if (mode === "register") {
      if (f.username.length < 3 || f.username.length > 20)
        e.username = "Username must be 3–20 characters.";
      else if (!USERNAME_RE.test(f.username))
        e.username = "Username may only contain letters, digits and _.";
    }

    if (!f.password) e.password = "Password is required.";
    else if (mode === "register") {
      const issue = checkPasswordStrength(f.password);
      if (issue) e.password = `${issue}.`;
      else if (isCommonPassword(f.password)) e.password = "This password is too common.";
    }
  }

  if (mode === "register") {
    if (!f.passwordConfirm) e.passwordConfirm = "Please confirm your password.";
    else if (f.password !== f.passwordConfirm) e.passwordConfirm = "Passwords do not match.";
  }

  return e;
}

export function AuthView() {
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  function reset() {
    setError(null);
    setInfo(null);
    setErrors({});
  }

  function clear(field: keyof Fields) {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: "" } : prev));
  }

  // Valide, puis exécute l'appel API ; renvoie false si la validation échoue.
  function guard(): boolean {
    setError(null);
    setInfo(null);
    const e = validate(mode, { firstName, lastName, email, username, password, passwordConfirm });
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function login() {
    if (!guard()) return;
    return loadingWrapper(setLoading, () =>
      API.auth.login({ username, password }).then((r) => {
        if (r.error) return setError(String(r.data));
        $user.set(r.data);
      }),
    );
  }

  function register() {
    if (!guard()) return;
    return loadingWrapper(setLoading, () =>
      API.auth
        .register({ username, email, password, first_name: firstName, last_name: lastName })
        .then((r) => {
          if (r.error) return setError(String(r.data));
          // On garde le username pour se connecter ; on vide les mots de passe
          setPassword("");
          setPasswordConfirm("");
          setInfo("Account created! Check your email to verify your account.");
          setMode("login");
        }),
    );
  }

  function forgotPassword() {
    if (!guard()) return;
    return loadingWrapper(setLoading, () =>
      API.auth.forgotPassword({ email }).then((r) => {
        if (r.error) return setError(String(r.data));
        setInfo("If an account exists, a reset link has been sent.");
      }),
    );
  }

  const submit = mode === "login" ? login : mode === "register" ? register : forgotPassword;

  // Bouton actif seulement quand tous les champs requis du mode sont remplis
  const canSubmit =
    mode === "login"
      ? username.trim() !== "" && password !== ""
      : mode === "register"
        ? firstName.trim() !== "" &&
          lastName.trim() !== "" &&
          email.trim() !== "" &&
          username.trim() !== "" &&
          password !== "" &&
          passwordConfirm !== ""
        : email.trim() !== "";

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-center text-2xl font-semibold">Matcha</h1>

        {mode === "register" && (
          <>
            <Field error={errors.firstName}>
              <Input
                placeholder="First name"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  clear("firstName");
                }}
              />
            </Field>
            <Field error={errors.lastName}>
              <Input
                placeholder="Last name"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  clear("lastName");
                }}
              />
            </Field>
          </>
        )}

        {(mode === "register" || mode === "forgot-password") && (
          <Field error={errors.email}>
            <Input
              placeholder="Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clear("email");
              }}
            />
          </Field>
        )}

        {mode !== "forgot-password" && (
          <>
            <Field error={errors.username}>
              <Input
                placeholder="Username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  clear("username");
                }}
              />
            </Field>
            <Field error={errors.password}>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clear("password");
                }}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            </Field>
          </>
        )}

        {mode === "register" && (
          <Field error={errors.passwordConfirm}>
            <Input
              type="password"
              placeholder="Confirm password"
              value={passwordConfirm}
              onChange={(e) => {
                setPasswordConfirm(e.target.value);
                clear("passwordConfirm");
              }}
            />
          </Field>
        )}

        <Button className="w-full" disabled={loading || !canSubmit} onClick={submit}>
          {loading
            ? "…"
            : mode === "login"
              ? "Log in"
              : mode === "register"
                ? "Sign up"
                : "Send reset link"}
        </Button>

        {error && <p className="text-destructive text-center text-sm">{error}</p>}
        {info && <p className="text-center text-sm text-green-600">{info}</p>}

        <div className="text-muted-foreground flex justify-between text-sm">
          <button
            type="button"
            onClick={() => {
              reset();
              setMode(mode === "login" ? "register" : "login");
            }}
          >
            {mode === "login" ? "Create an account" : "Back to login"}
          </button>
          {mode !== "forgot-password" && (
            <button
              type="button"
              onClick={() => {
                reset();
                setMode("forgot-password");
              }}
            >
              Forgot password?
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ error, children }: { error?: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      {children}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
