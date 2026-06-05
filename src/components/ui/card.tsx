import { forwardRef, type CSSProperties } from "react";
import { Surface, type SurfaceProps } from "./surface";

export type CardProps = SurfaceProps & {
  delay?: number;
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { delay = 0, style, ...rest },
  ref,
) {
  const animated: CSSProperties = {
    animation:
      "card-in var(--duration-base) var(--ease-out-soft) both",
    animationDelay: `${delay}ms`,
    ...style,
  };
  return <Surface ref={ref} style={animated} {...rest} />;
});
