import type { ReactNode } from "react";
import { useInView } from "@/components/hooks/useInView";
import { vars } from "@/lib/utils";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function Reveal({ children, delay = 0, className = "" }: RevealProps) {
  const [ref, seen] = useInView<HTMLDivElement>(0.15);

  return (
    <div
      ref={ref}
      className={`reveal ${seen ? "is-in" : ""} ${className}`}
      style={vars({ "--d": `${delay}ms` })}
    >
      {children}
    </div>
  );
}