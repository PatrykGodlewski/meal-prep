import type { PropsWithChildren } from "react";

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] w-full flex-1 justify-center">
      {children}
    </div>
  );
}
