import { useState } from "react";
import { API } from "@web/API/api";
import { $user } from "@web/observables/observables";
import { loadingWrapper } from "@web/utils/loadingWrapper";
import { Button } from "@shadcn/ui/button";
import { Input } from "@shadcn/ui/input";

type Mode = "login" | "register" | "forgot-password";

export function AuthView() {
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  function reset() {
    setError(null);
    setInfo(null);
  }

  function login() {
    reset();    
    return loadingWrapper(setLoading, () =>
      API.auth.login({ username, password }).then((r) => {
        if (r.error) return setError(String(r.data));
        $user.set(r.data);
      }),
    );
  }

  function register() {
    reset();
    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }
    return loadingWrapper(setLoading, () =>
      API.auth
        .register({ username, email, password, first_name: firstName, last_name: lastName })
        .then((r) => {
          if (r.error) return setError(String(r.data));
          setInfo("Account created! Check your email to verify your account.");
          setMode("login");
        }),
    );
  }

  function forgotPassword() {
    reset();
    return loadingWrapper(setLoading, () =>
      API.auth.forgotPassword({ email }).then((r) => {
        if (r.error) return setError(String(r.data));
        setInfo("If an account exists, a reset link has been sent.");
      }),
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-center text-2xl font-semibold">Matcha</h1>

        {mode === "register" && (
          <>
            <Input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <Input placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </>
        )}

        {mode === "forgot-password" && (
          <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        )}

        {mode !== "forgot-password" && (
          <>
            <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </>
        )}

        {mode === "register" && (
          <>
            <Input
              type="password"
              placeholder="Confirm Password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
            />
          </>
        )}

        <Button
          className="w-full"
          disabled={loading}
          onClick={mode === "login" ? login : mode === "register" ? register : forgotPassword}
        >
          {loading ? "…" : mode === "login" ? "Log in" : mode === "register" ? "Sign up" : "Send reset link"}
        </Button>

        {error && <p className="text-destructive text-center text-sm">{error}</p>}
        {info && <p className="text-center text-sm text-green-600">{info}</p>}

        <div className="flex justify-between text-sm text-muted-foreground">
          <button type="button" onClick={() => { reset(); setMode(mode === "login" ? "register" : "login"); }}>
            {mode === "login" ? "Create an account" : "Back to login"}
          </button>
          {mode !== "forgot-password" && (
            <button type="button" onClick={() => { reset(); setMode("forgot-password"); }}>
              Forgot password?
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
