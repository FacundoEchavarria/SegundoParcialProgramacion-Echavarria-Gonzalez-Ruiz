import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const variantes = {
  default: "bg-primary px-4 py-2.5 font-semibold text-white hover:bg-[#194633]",
  outline: "border bg-white px-3 py-2 font-medium hover:bg-background",
};

export function buttonVariants(variant: keyof typeof variantes = "default") {
  return cn(
    "rounded-lg text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60",
    variantes[variant],
  );
}

export function Button({ variant, className, type = "button", ...props }: ComponentProps<"button"> & {
  variant?: keyof typeof variantes;
}) {
  return <button data-slot="button" type={type} className={cn(buttonVariants(variant), className)} {...props} />;
}
