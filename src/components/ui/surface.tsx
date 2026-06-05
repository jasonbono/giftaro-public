import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

const VARIANT = {
  base: "bg-surface-base",
  raised: "bg-surface-raised",
  sunken: "bg-surface-sunken",
} as const;

const ELEVATION = {
  none: "",
  hairline: "border border-hairline shadow-hairline",
  soft: "border border-hairline shadow-soft",
  floating: "border border-hairline shadow-floating",
} as const;

export type SurfaceProps = {
  variant?: keyof typeof VARIANT;
  elevation?: keyof typeof ELEVATION;
  children: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(function Surface(
  { variant = "raised", elevation = "soft", className = "", children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      {...rest}
      className={`rounded-2xl ${VARIANT[variant]} ${ELEVATION[elevation]} ${className}`}
    >
      {children}
    </div>
  );
});
