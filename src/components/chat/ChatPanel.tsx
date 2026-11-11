import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PawPrint, RotateCcw, Send, X } from "lucide-react";
import { api } from "@/lib/api";
import { botReply, DEFAULT_CHIPS } from "@/lib/bot";
import { useStore } from "@/lib/store";
import { go } from "@/lib/utils";
import type { BotAction, BotReply } from "@/lib/types";

type Msg = { id: string; from: "bot" | "me"; text: string };

const MAX_SAVED = 40;
const storageKey = (userKey: string) => `lumina:chat:${userKey}`;

const greeting = (name: string | null): Msg => ({
  id: "greeting",
  from: "bot",
  text: `¡Guau! Soy Luma 🐶, la asistente de Lúmina${name ? `. Qué bueno verte, ${name.split(" ")[0]}` : ""}.\nPuedo ayudarte con citas, horarios, servicios y la tienda (incluso añadir productos a tu cesta).`,
});

function load(userKey: string): Msg[] {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(userKey)) ?? "[]") as unknown;
    return Array.isArray(saved) ? (saved as Msg[]).slice(-MAX_SAVED) : [];
  } catch {
    return [];
  }
}

/**
 * Ventana del chat. Se monta con `key={userKey}` desde Mascot: así cada cuenta (y el invitado) tiene su propia
 * conversación y no se mezclan al cambiar de sesión.
 */
export function ChatPanel({ onClose }: { onClose: () => void }) {
  const { userKey, user, products, cart, total, bookings, add, setCartOpen, setAuthOpen } = useStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [msgs, setMsgs] = useState<Msg[]>(() => {
    const saved = load(userKey);
    return saved.length ? saved : [greeting(user?.name ?? null)];
  });
  const [chips, setChips] = useState<string[]>(DEFAULT_CHIPS);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try { localStorage.setItem(storageKey(userKey), JSON.stringify(msgs.slice(-MAX_SAVED))); } catch { /* sin almacenamiento */ }
  }, [msgs, userKey]);

  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight, behavior: "smooth" }); }, [msgs, typing]);
  useEffect(() => { field.current?.focus(); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  /** Ejecuta lo que el bot pidió hacer en la web. */
  const run = (actions: BotAction[] = []) => {
    for (const a of actions) {
      if (a.type === "add") add(a.id, a.qty);
      else if (a.type === "openCart") setCartOpen(true);
      else if (a.type === "openAuth") setAuthOpen(true);
      else if (a.type === "goShop") navigate("/tienda");
      else if (a.type === "goHome") navigate("/");
      else if (a.type === "goBooking") {
        // Un instante para leer la respuesta antes de cerrar el chat y llevar al formulario.
        window.setTimeout(() => {
          onClose();
          if (pathname !== "/") navigate("/");
          window.setTimeout(() => go("cita"), pathname === "/" ? 150 : 700);
        }, 900);
      }
    }
  };

  const send = async (raw: string) => {
    const text = raw.trim().slice(0, 300);
    if (!text || typing) return;
    const history = msgs.slice(-8).map(({ from, text: t }) => ({ from, text: t }));
    setMsgs((m) => [...m, { id: crypto.randomUUID(), from: "me", text }]);
    setInput("");
    setChips([]);
    setTyping(true);
    const started = Date.now();

    let reply: BotReply = botReply(text, {
      products, cart, total,
      userName: user?.name ?? null,
      bookings: bookings.filter((b) => b.email === user?.email),
    });
    // Con API configurada, lo que el bot local no entiende se le pregunta al servidor.
    if (reply.fallback && api.remote) {
      const remote = await api.chat(text, history).catch(() => null);
      if (remote && typeof remote.text === "string") reply = remote;
    }

    // Pausa corta para que se sienta natural.
    await new Promise((resolve) => setTimeout(resolve, Math.max(0, 700 - (Date.now() - started))));
    setTyping(false);
    setMsgs((m) => [...m, { id: crypto.randomUUID(), from: "bot", text: reply.text }]);
    setChips(reply.chips ?? DEFAULT_CHIPS);
    run(reply.actions);
  };

  const submit = (e: FormEvent) => { e.preventDefault(); void send(input); };
  const reset = () => { setMsgs([greeting(user?.name ?? null)]); setChips(DEFAULT_CHIPS); setInput(""); };

  return (
    <section
      id="luma-chat"
      role="dialog"
      aria-label="Chat con Luma"
      className="chat-open absolute bottom-full left-0 mb-2 flex h-[min(32rem,calc(100svh-11rem))] w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-3xl border bg-card shadow-2xl"
    >
      <header className="flex items-center gap-3 border-b bg-secondary px-4 py-3">
        <span className="relative flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <PawPrint className="size-4" />
          <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-secondary bg-emerald-400" />
        </span>
        <div className="flex-1 leading-tight">
          <p className="font-display text-lg">Luma</p>
          <p className="text-xs text-muted-foreground">Asistente de Lúmina</p>
        </div>
        <button onClick={reset} aria-label="Nueva conversación" title="Nueva conversación" className="text-muted-foreground hover:text-primary">
          <RotateCcw className="size-4" />
        </button>
        <button onClick={onClose} aria-label="Cerrar chat" className="text-muted-foreground hover:text-primary">
          <X className="size-5" />
        </button>
      </header>

      <div ref={box} role="log" aria-live="polite" className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {msgs.map((m) => (
          <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
            <p className={`bubble max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-6 whitespace-pre-line ${m.from === "me" ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-muted"}`}>
              {m.text}
            </p>
          </div>
        ))}
        {typing && (
          <div className="chat-dots flex w-fit rounded-2xl rounded-bl-md bg-muted px-3 py-3" aria-label="Luma está escribiendo">
            <i /><i /><i />
          </div>
        )}
      </div>

      {chips.length > 0 && !typing && (
        <div className="flex flex-wrap gap-2 px-4 pb-2">
          {chips.map((c) => (
            <button key={c} onClick={() => void send(c)} className="rounded-full border px-3 py-1 text-xs transition-colors hover:border-primary hover:text-primary">
              {c}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="flex gap-2 border-t p-3">
        <input
          ref={field}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={300}
          placeholder="Escribe tu mensaje…"
          aria-label="Mensaje"
          className="h-10 min-w-0 flex-1 rounded-full border bg-background px-4 text-sm outline-none focus-visible:border-ring"
        />
        <button
          type="submit"
          aria-label="Enviar"
          disabled={!input.trim() || typing}
          className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
        >
          <Send className="size-4" />
        </button>
      </form>
      <p className="px-4 pb-3 text-[10px] leading-snug text-muted-foreground">Luma es un asistente automático: no reemplaza a un veterinario.</p>
    </section>
  );
}
