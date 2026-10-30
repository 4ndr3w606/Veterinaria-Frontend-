import type { ReactNode } from "react";

interface TiltProps {
  children: ReactNode;
}

export function Tilt({ children }: TiltProps) {
  return (
    <div
      className="tilt h-full"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const s = e.currentTarget.style;
        s.setProperty("--ry", `${((e.clientX - r.left) / r.width - 0.5) * 14}deg`);
        s.setProperty("--rx", `${(0.5 - (e.clientY - r.top) / r.height) * 14}deg`);
        s.setProperty("--mx", `${e.clientX - r.left}px`);
        s.setProperty("--my", `${e.clientY - r.top}px`);
      }}
      onPointerLeave={(e) => {
        e.currentTarget.style.setProperty("--rx", "0deg");
        e.currentTarget.style.setProperty("--ry", "0deg");
      }}
    >
      {children}
    </div>
  );
}