import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: ComponentProps<"span">) {
  return <span data-slot="badge" className={cn("inline-block rounded-full px-2 py-1 text-xs font-semibold", className)} {...props} />;
}
