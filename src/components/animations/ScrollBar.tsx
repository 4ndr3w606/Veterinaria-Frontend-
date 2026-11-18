import { useEffect, useRef } from "react";
import { PawPrint } from "lucide-react";

export function ScrollBar() {
  const bar = useRef<HTMLDivElement>(null);
  const paw = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const draw = () => {
      frame = 0;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const progress = height > 0 ? Math.min(1, Math.max(0, window.scrollY / height)) : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${progress})`;
      if (paw.current) {
        paw.current.style.transform = `translateX(${progress * 100}%)`;
        paw.current.style.opacity = progress > 0.005 ? "1" : "0";
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(draw); };
    draw();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const resize = new ResizeObserver(schedule);
    resize.observe(document.documentElement);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-1" aria-hidden="true">
      <div ref={bar} className="h-full origin-left bg-gradient-to-r from-accent to-primary" style={{ transform: "scaleX(0)" }} />
      <div ref={paw} className="absolute top-1.5 left-0 w-full transition-opacity duration-200" style={{ opacity: 0 }}>
        <PawPrint className="absolute -left-2.5 size-5 rotate-90 text-primary" />
      </div>
    </div>
  );
}