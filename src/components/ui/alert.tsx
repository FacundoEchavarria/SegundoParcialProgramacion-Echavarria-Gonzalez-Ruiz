import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Alert({ className, variant = "default", ...props }: ComponentProps<"div"> & {
  variant?: "default" | "destructive" | "success";
}) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(
        "rounded-lg border px-3 py-2 text-sm",
        variant === "default" && "bg-card",
        variant === "destructive" && "border-red-200 bg-red-50 text-red-900",
        variant === "success" && "border-emerald-200 bg-emerald-50 text-emerald-950",
        className,
      )}
      {...props}
    />
  );
}
