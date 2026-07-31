import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { API } from "@web/API/api";
import { loadingWrapper } from "@web/utils/loadingWrapper";
import { Button } from "@shadcn/ui/button";
import { Input } from "@shadcn/ui/input";

export function ResetPasswordView() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function submit() {
    setError(null);
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
        <h1 className="text-center text-2xl font-semibold">Choose a new password</h1>

        {done ? (
          <p className="text-center text-green-600">Password updated! Redirecting to login…</p>
        ) : (
          <>
            <Input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button className="w-full" disabled={loading || !token} onClick={submit}>
              {loading ? "…" : "Reset password"}
            </Button>
            {error && <p className="text-destructive text-center text-sm">{error}</p>}
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
