import { authorize } from "@/lib/authorization";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

export default async function MealsLayout({ children }: PropsWithChildren) {
  const user = await authorize();
  if (!user) redirect("/sign-in");

  return children;
}
