import { forwardRef, type ButtonHTMLAttributes } from "react";

const BASE =
  "inline-flex items-center justify-center gap-2 font-semibold " +
  "transition-[transform,box-shadow,background-color,color] duration-150 " +
  "active:scale-[0.98] touch-manipulation select-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:ring-offset-2 " +
  "disabled:pointer-events-none disabled:opacity-50";

const VARIANT = {
  primary:
    "bg-brand text-white shadow-brand-glow ring-1 ring-inset ring-white/15 hover:bg-brand-dark",
  secondary:
    "bg-surface-raised text-ink-primary border border-hairline shadow-hairline hover:bg-surface-sunken",
  ghost: "text-ink-primary hover:bg-surface-sunken",
} as const;

const SHAPE = {
  pill: "rounded-full",
  block: "w-full rounded-xl",
} as const;

const SIZE = {
  sm: "px-4 py-1.5 text-xs",
  md: "px-6 py-3 text-sm",
  lg: "px-7 py-4 text-base",
} as const;

export type ButtonVariant = keyof typeof VARIANT;
export type ButtonShape = keyof typeof SHAPE;
export type ButtonSize = keyof typeof SIZE;

export function buttonClasses(
  variant: ButtonVariant = "primary",
  shape: ButtonShape = "pill",
  size: ButtonSize = "md",
  extra = "",
) {
  return `${BASE} ${VARIANT[variant]} ${SHAPE[shape]} ${SIZE[size]} ${extra}`;
}

export type ButtonProps = {
  variant?: ButtonVariant;
  shape?: ButtonShape;
  size?: ButtonSize;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", shape = "pill", size = "md", className = "", type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      {...rest}
      className={buttonClasses(variant, shape, size, className)}
    />
  );
});
