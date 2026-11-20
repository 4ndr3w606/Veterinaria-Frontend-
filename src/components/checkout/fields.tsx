import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Mismo aspecto que <Input>, para select y textarea nativos. */
export const controlClass =
  "w-full min-w-0 rounded-xl border border-input bg-transparent px-3 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  className?: string;
  children: ReactNode;
};

/** Etiqueta, control, ayuda y error. El control debe usar aria-describedby={describedBy(id, error, hint)}. */
export function Field({ id, label, error, hint, optional, className, children }: FieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={id} className="flex items-baseline justify-between gap-2 text-sm font-medium">
        {label}
        {optional && <span className="text-xs font-normal text-muted-foreground">Opcional</span>}
      </label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p id={`${id}-error`} className="bubble text-sm text-destructive">{error}</p>}
    </div>
  );
}

export const describedBy = (id: string, error?: string, hint?: string) =>
  error ? `${id}-error` : hint ? `${id}-hint` : undefined;

export function SelectWrap({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
    </div>
  );
}

type ChoiceProps = {
  name: string;
  value: string;
  checked: boolean;
  label: string;
  detail: string;
  id?: string;
  icon?: ReactNode;
  invalid?: boolean;
  describedById?: string;
  onChange: (value: string) => void;
};

/** Opción de radio presentada como tarjeta; el input sigue siendo nativo para teclado y lectores de pantalla. */
export function Choice({ name, value, checked, label, detail, id, icon, invalid, describedById, onChange }: ChoiceProps) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors hover:border-primary/60 has-checked:border-primary has-checked:bg-primary/10 has-focus-visible:ring-3 has-focus-visible:ring-ring/50">
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        aria-invalid={invalid || undefined}
        aria-describedby={describedById}
        onChange={() => onChange(value)}
        className="mt-1 size-4 shrink-0 accent-primary"
      />
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{label}</span>
        <span className="block text-sm text-muted-foreground">{detail}</span>
      </span>
      {icon && <span className="text-primary" aria-hidden="true">{icon}</span>}
    </label>
  );
}
