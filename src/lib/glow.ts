import type { MouseEvent } from "react";

/** Pasa el cursor a --mx/--my para que .glow-card se ilumine */
export const glow = (e: MouseEvent<HTMLElement>) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
};
