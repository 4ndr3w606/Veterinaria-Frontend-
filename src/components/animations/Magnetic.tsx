import type { ReactNode, PointerEvent } from "react";

interface MagneticProps {
  children: ReactNode;
  className?: string;
}

export function Magnetic({ children, className = "inline-block" }: MagneticProps) {
  const handlePointerMove = (e: PointerEvent<HTMLSpanElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * 0.3;
    const y = (e.clientY - (r.top + r.height / 2)) * 0.3;
    e.currentTarget.style.transform = `translate(${x}px, ${y}px)`;
  };

  const handlePointerLeave = (e: PointerEvent<HTMLSpanElement>) => {
    e.currentTarget.style.transform = "";
  };

  return (
    <span
      className={`magnetic p-3 -m-3 ${className}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {children}
    </span>
  );
}