import { useEffect, useRef } from "react";
import { useInView } from "../hooks/useInView";

interface CounterProps {
  to: number;
  suffix?: string;
}

export function Counter({ to, suffix = "" }: CounterProps) {
  const [ref, seen] = useInView<HTMLSpanElement>(0.4);
  const value = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!seen) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 2200);
      const text = Math.round(to * (1 - Math.pow(1 - k, 4))).toLocaleString("es-CO");
      if (value.current && value.current.textContent !== text) value.current.textContent = text;
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, to]);

  return <span ref={ref}><span ref={value}>0</span>{suffix}</span>;
}