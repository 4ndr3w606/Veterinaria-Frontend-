import { useEffect, useState } from "react";
import { PawPrint } from "lucide-react";

export function ScrollBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(totalHeight > 0 ? window.scrollY / totalHeight : 0);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-1" aria-hidden="true">
      <div
        className="h-full bg-gradient-to-r from-accent to-primary"
        style={{ width: `${progress * 100}%` }}
      />
      <PawPrint
        className="absolute top-1.5 size-5 rotate-90 text-primary transition-opacity duration-200"
        style={{
          left: `calc(${progress * 100}% - 10px)`,
          opacity: progress > 0.005 ? 1 : 0,
        }}
      />
    </div>
  );
}