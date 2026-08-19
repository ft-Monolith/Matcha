import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { API } from "@web/API/api";
import { loadingWrapper } from "@web/utils/loadingWrapper";
import { checkPasswordStrength } from "@common/utils/password_strength";
import { isCommonPassword } from "@common/utils/bad_words";
import { Button } from "@shadcn/ui/button";
import { Input } from "@shadcn/ui/input";

export function ResetPasswordView() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function submit() {
    setError(null);

    const issue = checkPasswordStrength(password);
    const pwdErr = !password
      ? "Password is required."
      : issue
        ? `${issue}.`
        : isCommonPassword(password)
          ? "This password is too common."
          : null;
    const confErr = !confirm
      ? "Please confirm your password."
      : password !== confirm
        ? "Passwords do not match."
        : null;

    setPasswordError(pwdErr);
    setConfirmError(confErr);
    if (pwdErr || confErr) return;

    return loadingWrapper(setLoading, () =>
      API.auth.resetPassword({ token, password }).then((r) => {
        if (r.error) return setError(String(r.data));
        setDone(true);
        setTimeout(() => navigate("/"), 1500);
      }),
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-center text-2xl font-semibold">
          Choose a new password
        </h1>

        {!token ? (
          <p className="text-destructive text-center text-sm">
            Invalid or missing reset link. Please request a new one.
          </p>
        ) : done ? (
          <p className="text-center text-green-600">
            Password updated! Redirecting to login…
          </p>
        ) : (
          <>
            <div className="space-y-1">
              <Input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError(null);
                }}
              />
              {passwordError && (
                <p className="text-destructive text-xs">{passwordError}</p>
              )}
            </div>

            <div className="space-y-1">
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  setConfirmError(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
              {confirmError && (
                <p className="text-destructive text-xs">{confirmError}</p>
              )}
            </div>

            <Button className="w-full" disabled={loading} onClick={submit}>
              {loading ? "…" : "Reset password"}
            </Button>
            {error && (
              <p className="text-destructive text-center text-sm">{error}</p>
            )}
            <div className="text-center">
              <Link to="/" className="text-sm underline">
                Back to login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
