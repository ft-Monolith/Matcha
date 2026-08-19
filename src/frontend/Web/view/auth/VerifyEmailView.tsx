import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { API } from "@web/API/api";

export function VerifyEmailView() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");

  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }

    API.auth.verifyEmail({ token }).then((r) => {
      if (r.error) {
        setStatus("error");
        setMessage(String(r.data));
      } else {
        setStatus("ok");
        setMessage("Your email has been verified. You can now log in.");
      }
    });
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Email verification</h1>
        {status === "loading" && (
          <p className="text-muted-foreground">Verifying…</p>
        )}
        {status === "ok" && <p className="text-green-600">{message}</p>}
        {status === "error" && <p className="text-destructive">{message}</p>}
        <Link to="/" className="text-sm underline">
          Go to login
        </Link>
      </div>
    </div>
  );
}
