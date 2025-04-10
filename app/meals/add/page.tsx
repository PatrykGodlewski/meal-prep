import AddMealForm from "@/components/form-meal";
import { authorize } from "@/lib/authorization";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default function Home() {
  return (
    <div>
      <AddMealForm />
    </div>
  );
}
