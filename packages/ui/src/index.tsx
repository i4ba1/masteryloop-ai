import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

export function Button({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`button ${className}`} {...props} />;
}

export function Panel({ className = "", ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={`panel ${className}`} {...props} />;
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="wordmark">
      <span className="brand-symbol" aria-hidden="true">
        m
      </span>
      MasteryLoop{!compact && <span className="brand-ai">AI</span>}
    </span>
  );
}

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="empty-state">
      <span className="empty-mark" aria-hidden="true">
        +
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
