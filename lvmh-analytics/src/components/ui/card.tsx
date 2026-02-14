import type { ReactNode } from "react";

export const Card = ({ children }: { children: ReactNode }) => (
  <div className="overflow-visible rounded-2xl border border-neutral-900 bg-neutral-950/80 p-5">{children}</div>
);

export const CardHeader = ({ title, description }: { title: string; description?: string }) => (
  <div className="mb-3">
    <h2 className="text-sm font-semibold text-neutral-50">{title}</h2>
    {description && <p className="mt-1 text-xs text-neutral-500">{description}</p>}
  </div>
);

export const CardBody = ({ children }: { children: ReactNode }) => (
  <div className="overflow-visible min-w-0">{children}</div>
);

