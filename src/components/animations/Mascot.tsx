import { useEffect, useRef, useState } from "react";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { useStore } from "@/lib/store";

/** Luma: la mascota y, al hacer clic, el chatbot de la web. */
export function Mascot() {
  const ref = useRef<HTMLDivElement>(null);
  const { userKey } = useStore();
  const [say, setSay] = useState<string | null>(null);
  const [hop, setHop] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Escucha el movimiento del cursor para mover las pupilas de Luma
    const handlePointerMove = (e: globalThis.PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height * 0.45);
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / 220) * 3.6;

      el.style.setProperty("--ex", `${(dx / d) * k}px`);
      el.style.setProperty("--ey", `${(dy / d) * k}px`);
    };

    window.addEventListener("pointermove", handlePointerMove);

    // Saludo inicial automático
    const timerA = window.setTimeout(() => setSay("¡Hola! Soy Luma. ¿Te ayudo?"), 2400);
    const timerB = window.setTimeout(() => setSay(null), 7000);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      clearTimeout(timerA);
      clearTimeout(timerB);
    };
  }, []);

  // Al hacer clic: salta y abre o cierra el chat
  const toggle = () => {
    setHop(true);
    window.setTimeout(() => setHop(false), 650);
    setOpen((o) => !o);
  };

  return (
    <div ref={ref} className="fixed bottom-2 left-3 z-40">
      {open && <ChatPanel key={userKey} onClose={() => setOpen(false)} />}
      {say && !open && (
        <span className="bubble absolute -top-8 left-14 whitespace-nowrap rounded-full bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
          {say}
        </span>
      )}
      <button
        onClick={toggle}
        aria-label={open ? "Cerrar chat con Luma" : "Abrir chat con Luma"}
        aria-expanded={open}
        aria-controls="luma-chat"
        className={`luma block ${hop ? "hop" : ""}`}
      >
        <svg viewBox="0 0 130 120" className="size-24 drop-shadow-xl sm:size-28">
          <path
            className="luma-tail"
            d="M92 96 C112 90 118 70 108 56"
            stroke="#d99a78"
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
          />
          <ellipse cx="62" cy="100" rx="30" ry="20" fill="#f2b99a" />
          <ellipse
            cx="36"
            cy="46"
            rx="11"
            ry="21"
            fill="#d99a78"
            transform="rotate(20 36 46)"
          />
          <ellipse
            cx="88"
            cy="46"
            rx="11"
            ry="21"
            fill="#d99a78"
            transform="rotate(-20 88 46)"
          />
          <circle cx="62" cy="58" r="30" fill="#f2b99a" />
          <ellipse cx="62" cy="71" rx="16" ry="12" fill="#f1ecdf" />
          {[50, 74].map((cx) => (
            <g key={cx} className="luma-eye">
              <circle cx={cx} cy="54" r="8" fill="#fff" />
              <circle className="luma-pupil" cx={cx} cy="54" r="4.2" fill="#0e1f1b" />
            </g>
          ))}
          <ellipse cx="62" cy="65" rx="5" ry="3.5" fill="#0e1f1b" />
          <path
            d="M55 74 Q62 81 69 74"
            stroke="#0e1f1b"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <path className="luma-tongue" d="M59 77 q3 9 7 0 z" fill="#e5736a" />
        </svg>
      </button>
    </div>
  );
}
