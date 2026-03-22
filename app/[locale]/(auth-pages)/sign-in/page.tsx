"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { isSignUpEnabled } from "@/lib/feature-flags";

export default function SignIn() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations("auth");

  const effectiveFlow = isSignUpEnabled ? flow : "signIn";

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-md flex-col items-center justify-center px-4 py-12">
      <Card className="w-full shadow-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="font-semibold text-2xl tracking-tight">
            {effectiveFlow === "signIn" ? t("signIn") : t("signUp")}
          </CardTitle>
          <CardDescription>{t("logInToSeeNumbers")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              const formData = new FormData(e.target as HTMLFormElement);
              formData.set("flow", effectiveFlow);
              void signIn("password", formData)
                .catch((err) => {
                  setError(err.message);
                })
                .then(() => {
                  router.push("/");
                });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="email">{t("emailPlaceholder")}</Label>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder={t("emailPlaceholder")}
                required
                autoComplete="email"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("passwordPlaceholder")}</Label>
              <Input
                id="password"
                type="password"
                name="password"
                placeholder={t("passwordPlaceholder")}
                required
                autoComplete={
                  effectiveFlow === "signIn"
                    ? "current-password"
                    : "new-password"
                }
                className="h-10"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2">
                <p className="text-destructive text-sm">
                  {t("errorSigningIn", { error })}
                </p>
              </div>
            )}

            <div className="text-center text-sm">
              <Link
                href="/forgot-password"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {t("forgotPassword")}
              </Link>
            </div>

            <Button type="submit" size="lg" className="w-full">
              {effectiveFlow === "signIn" ? t("signIn") : t("signUp")}
            </Button>

            {isSignUpEnabled && (
              <div className="flex flex-wrap items-center justify-center gap-x-1.5 text-center text-muted-foreground text-sm">
                <span>
                  {effectiveFlow === "signIn"
                    ? t("dontHaveAccount")
                    : t("alreadyHaveAccount")}
                </span>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto cursor-pointer p-0 font-medium text-primary underline-offset-4 hover:underline"
                  onClick={() =>
                    setFlow(effectiveFlow === "signIn" ? "signUp" : "signIn")
                  }
                >
                  {effectiveFlow === "signIn"
                    ? t("signUpInstead")
                    : t("signInInstead")}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
