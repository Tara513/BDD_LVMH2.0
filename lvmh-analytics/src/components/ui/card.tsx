import type { ReactNode } from "react";

export const Card = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={`overflow-visible rounded-2xl border border-neutral-800 bg-neutral-900 text-neutral-100 p-5 ${className ?? ""}`}>{children}</div>
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

