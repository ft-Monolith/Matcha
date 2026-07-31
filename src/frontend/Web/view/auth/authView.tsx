import { useState } from "react";
import { API } from "@web/API/api";
import { loadingWrapper } from "@web/utils/loadingWrapper";
import { Button } from "@shadcn/ui/button";
import { Badge } from "@shadcn/ui/badge";

export function MainWindow() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authState, setAuthState] = useState<
    "register" | "login" | "forgot-password"
  >("login");

  function login() {
    return loadingWrapper(setLoading, () =>
      API.auth
        .login({ username: "test.com", password: "password" })
        .then((r) => {
          console.log("login", r);
        }),
    );
  }

  function register() {
    return loadingWrapper(setLoading, () =>
      API.auth
        .register({
          username: "test.com",
          email: "test.com",
          password: "password",
          first_name: "Test",
          last_name: "User",
        })
        .then((r) => {
          console.log("register", r);
        }),
    );
  }

  function forgotPassword() {
    return loadingWrapper(setLoading, () =>
      API.auth.forgotPassword({ email: "test.com" }).then((r) => {
        console.log("forgotPassword", r);
      }),
    );
  }

  return <div className="flex min-h-screen flex-col">test</div>;
}
