import type { ButtonHTMLAttributes } from "react";

export const Button = ({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={`rounded-full bg-neutral-100 px-4 py-2 text-xs font-medium text-neutral-900 transition hover:bg-neutral-200 disabled:cursor-default disabled:opacity-50 ${className}`}
  >
    {children}
  </button>
);

