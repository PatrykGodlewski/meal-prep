import AddMealForm from "@/components/form-meal";
import { authorize } from "@/lib/authorization";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await authorize();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <div>
      <AddMealForm />
    </div>
  );
}
