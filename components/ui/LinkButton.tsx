import Link, { type LinkProps } from "next/link";
import React from "react";
import { buttonSizes, buttonVariants } from "./Button";

interface LinkButtonProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">,
    LinkProps {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  fullWidth?: boolean;
}

export function LinkButton({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  ...rest
}: LinkButtonProps) {
  const base =
    "inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background rounded-xl font-semibold";
  const w = fullWidth ? "w-full" : "";

  return (
    <Link
      className={`${base} ${buttonVariants[variant]} ${buttonSizes[size]} ${w} ${className}`}
      {...rest}
    >
      {children}
    </Link>
  );
}
