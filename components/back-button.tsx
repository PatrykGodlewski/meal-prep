"use client";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";

export function BackButton() {
  const router = useRouter();

  return (
    <Button
      variant="link"
      onClick={() => router.back()}
      className="p-0 h-auto text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
    >
      <ArrowLeft className="h-4 w-4 mr-1" /> Back
    </Button>
  );
}
