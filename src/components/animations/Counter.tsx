import { useEffect, useState } from "react";
import { useInView } from "../hooks/useInView";

interface CounterProps {
  to: number;
  suffix?: string;
}

export function Counter({ to, suffix = "" }: CounterProps) {
  const [ref, seen] = useInView<HTMLSpanElement>(0.4);
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!seen) return;

    let raf = 0;
    const t0 = performance.now();

    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 2200);
      
      setValue(Math.round(to * (1 - Math.pow(1 - k, 4))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, to]);

  return (
    <span ref={ref}>
      {value.toLocaleString("es-CO")}
      {suffix}
    </span>
  );
}