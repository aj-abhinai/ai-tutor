import Link, { type LinkProps } from "next/link";
import React from "react";

interface TextLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">,
    LinkProps {}

export function TextLink({ className = "", children, ...rest }: TextLinkProps) {
  return (
    <Link
      className={`font-semibold text-secondary transition-colors hover:text-secondary-hover ${className}`}
      {...rest}
    >
      {children}
    </Link>
  );
}
