import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

const BASE =
  "w-full rounded-xl bg-surface-raised border border-hairline px-4 py-3 " +
  "text-base text-ink-primary placeholder:text-ink-faint " +
  "outline-none transition-colors " +
  "focus:border-brand focus:ring-2 focus:ring-brand/20 " +
  "disabled:bg-surface-sunken disabled:text-ink-muted disabled:cursor-not-allowed";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", ...rest }, ref) {
    return <input ref={ref} {...rest} className={`${BASE} ${className}`} />;
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className = "", ...rest }, ref) {
  return <textarea ref={ref} {...rest} className={`${BASE} ${className}`} />;
});
