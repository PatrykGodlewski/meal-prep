import WeekPlannerPage from "@/components/server-components/week-planner";
import { authorize } from "@/lib/authorization";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await authorize();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <div>
      <WeekPlannerPage />
      {"TODO: create a todo buy basket list"}
    </div>
  );
}
