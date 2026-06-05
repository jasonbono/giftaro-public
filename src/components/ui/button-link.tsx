import Link, { type LinkProps } from "next/link";
import { forwardRef, type AnchorHTMLAttributes } from "react";
import {
  buttonClasses,
  type ButtonShape,
  type ButtonSize,
  type ButtonVariant,
} from "./button";

export type ButtonLinkProps = {
  variant?: ButtonVariant;
  shape?: ButtonShape;
  size?: ButtonSize;
} & LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps>;

export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  function ButtonLink(
    { variant = "primary", shape = "pill", size = "md", className = "", ...rest },
    ref,
  ) {
    return (
      <Link
        ref={ref}
        {...rest}
        className={buttonClasses(variant, shape, size, className)}
      />
    );
  },
);
