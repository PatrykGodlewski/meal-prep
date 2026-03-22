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

export default function ForgotPassword() {
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<"forgot" | { email: string }>("forgot");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations("auth");

  return step === "forgot" ? (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-md flex-col items-center justify-center px-4 py-12">
      <Card className="w-full shadow-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="font-semibold text-2xl tracking-tight">
            {t("forgotPassword")}
          </CardTitle>
          <CardDescription>{t("forgotPasswordDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              const formData = new FormData(e.currentTarget);
              formData.set("flow", "reset");
              void signIn("password", formData)
                .then(() => setStep({ email: formData.get("email") as string }))
                .catch((err) => setError(err.message));
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

            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2">
                <p className="text-destructive text-sm">
                  {t("errorSigningIn", { error })}
                </p>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full">
              {t("sendResetCode")}
            </Button>

            <div className="text-center text-muted-foreground text-sm">
              <Link
                href="/sign-in"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {t("backToSignIn")}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  ) : (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-md flex-col items-center justify-center px-4 py-12">
      <Card className="w-full shadow-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="font-semibold text-2xl tracking-tight">
            {t("resetPassword")}
          </CardTitle>
          <CardDescription>{t("resetPasswordDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              const formData = new FormData(e.currentTarget);
              formData.set("email", step.email);
              formData.set("flow", "reset-verification");
              void signIn("password", formData)
                .then(() => router.push("/"))
                .catch((err) => setError(err.message));
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="code">{t("resetCodePlaceholder")}</Label>
              <Input
                id="code"
                type="text"
                name="code"
                placeholder={t("resetCodePlaceholder")}
                required
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={8}
                className="h-10 font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t("newPasswordPlaceholder")}</Label>
              <Input
                id="newPassword"
                type="password"
                name="newPassword"
                placeholder={t("newPasswordPlaceholder")}
                required
                autoComplete="new-password"
                minLength={8}
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

            <Button type="submit" size="lg" className="w-full">
              {t("resetPasswordButton")}
            </Button>

            <div className="flex justify-between gap-2 text-muted-foreground text-sm">
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto cursor-pointer p-0 font-medium text-primary underline-offset-4 hover:underline"
                onClick={() => setStep("forgot")}
              >
                {t("cancel")}
              </Button>
              <Link
                href="/sign-in"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {t("backToSignIn")}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
