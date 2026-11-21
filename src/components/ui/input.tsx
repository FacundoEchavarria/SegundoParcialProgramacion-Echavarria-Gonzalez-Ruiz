import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const inputClassName =
  "w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:bg-background";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input data-slot="input" className={cn(inputClassName, className)} {...props} />;
}
