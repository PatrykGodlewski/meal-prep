"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useTranslations } from "next-intl";

export default function SignIn() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations("auth");

  return (
    <div className="flex flex-col gap-8 w-96 mx-auto h-screen justify-center items-center">
      <p>{t("logInToSeeNumbers")}</p>
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", flow);
          void signIn("password", formData)
            .catch((error) => {
              setError(error.message);
            })
            .then(() => {
              router.push("/");
            });
        }}
      >
        <Input
          type="email"
          name="email"
          placeholder={t("emailPlaceholder")}
          required
        />
        <Input
          type="password"
          name="password"
          placeholder={t("passwordPlaceholder")}
          required
        />
        <Button type="submit">
          {flow === "signIn" ? t("signIn") : t("signUp")}
        </Button>
        <div className="flex flex-row gap-2">
          <span>
            {flow === "signIn" ? t("dontHaveAccount") : t("alreadyHaveAccount")}
          </span>
          <Button
            variant="link"
            className="text-foreground underline hover:no-underline cursor-pointer"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? t("signUpInstead") : t("signInInstead")}
          </Button>
        </div>
        {error && (
          <div className="bg-red-500/20 border-2 border-red-500/50 rounded-md p-2">
            <p className="text-foreground font-mono text-xs">
              {t("errorSigningIn", { error })}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
