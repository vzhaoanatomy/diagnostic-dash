import { cn } from "@/lib/utils";

export type MedicalTheme = "landing" | "teacher" | "student" | "auth";

export function MedicalShell({
  theme = "landing",
  children,
  className,
}: {
  theme?: MedicalTheme;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("medical-shell", `medical-theme-${theme}`, className)}>
      <div className="medical-grid" aria-hidden="true" />
      <div className="medical-glow" aria-hidden="true" />
      <div className="medical-ecg" aria-hidden="true" />
      <div className="medical-shell-content">{children}</div>
    </div>
  );
}

export function MedicalCard({
  className,
  children,
  accent,
}: {
  className?: string;
  children: React.ReactNode;
  accent?: "blue" | "teal" | "rose";
}) {
  return (
    <div
      className={cn(
        "medical-card rounded-xl border bg-card/95 text-card-foreground shadow-sm backdrop-blur-sm",
        accent === "teal" && "medical-card-accent-teal",
        accent === "rose" && "medical-card-accent-rose",
        (accent === "blue" || !accent) && "medical-card-accent-blue",
        className
      )}
    >
      {children}
    </div>
  );
}

export function MedicalIconBadge({
  children,
  variant = "blue",
  className,
}: {
  children: React.ReactNode;
  variant?: "blue" | "teal" | "rose";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-12 w-12 items-center justify-center rounded-xl shadow-sm",
        variant === "blue" && "medical-icon-badge-blue",
        variant === "teal" && "medical-icon-badge-teal",
        variant === "rose" && "medical-icon-badge-rose",
        className
      )}
    >
      {children}
    </div>
  );
}

export function MedicalPageHeader({
  title,
  description,
  badge,
}: {
  title: string;
  description?: string;
  badge?: string;
}) {
  return (
    <div className="medical-page-header mb-8">
      {badge && <span className="medical-badge mb-3 inline-block">{badge}</span>}
      <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>}
    </div>
  );
}
