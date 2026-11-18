import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { PawPrint, RotateCcw, Send, X } from "lucide-react";
import { botReply, DEFAULT_CHIPS } from "@/lib/bot";
import { useStore } from "@/lib/store";
import { isRecord } from "@/lib/apiValidation";
import { readLocalStorageJson, setLocalStorageItem } from "@/lib/safeStorage";
import type { BotAction } from "@/lib/types";

type Msg = { id: string; from: "bot" | "me"; text: string };
const MAX_SAVED = 40;
const storageKey = (userKey: string) => `lumina:chat:${userKey}`;
const greeting = (name: string | null): Msg => ({
  id: "greeting",
  from: "bot",
  text: `¡Guau! Soy Luma 🐶${name ? `, hola ${name.trim().split(/\s+/)[0]}` : ""}. Puedo informarte sobre servicios y horarios, buscar productos, mostrar tus citas y abrir las secciones de la web.`,
});

function load(userKey: string, name: string | null): Msg[] {
  const saved = readLocalStorageJson<unknown>(storageKey(userKey), []);
  if (!Array.isArray(saved)) return [greeting(name)];
  const valid = saved.filter((msg): msg is Msg => isRecord(msg) && typeof msg.id === "string" &&
    (msg.from === "bot" || msg.from === "me") && typeof msg.text === "string").slice(-MAX_SAVED);
  return valid.length ? valid.map((msg) => msg.id === "greeting" ? greeting(name) : msg) : [greeting(name)];
}

/** La key de Mascot mantiene separada la conversación de cada cuenta. */
export function ChatPanel({ onClose }: { onClose: () => void }) {
  const { userKey, user, products, bookings, setCartOpen, setAuthOpen } = useStore();
  const navigate = useNavigate();
  const [msgs, setMsgs] = useState<Msg[]>(() => load(userKey, user?.name ?? null));
  const [chips, setChips] = useState<string[]>(DEFAULT_CHIPS);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const timer = useRef<number | null>(null);

  const cancelReply = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => cancelReply, []);
  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight, behavior: "smooth" }); }, [msgs, typing]);
  useEffect(() => { field.current?.focus(); }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const run = (action?: BotAction) => {
    if (!action) return;
    onClose();
    if (action === "openCart") setCartOpen(true);
    else if (action === "openAuth") setAuthOpen(true);
    else if (action === "goShop") navigate("/tienda");
    else if (action === "goBooking") navigate("/#cita");
  };
  const saveMessages = (messages: Msg[]) => {
    const next = messages.slice(-MAX_SAVED);
    setMsgs(next);
    // Guarda también la respuesta que abre otra sección y desmonta el chat.
    setLocalStorageItem(storageKey(userKey), JSON.stringify(next));
    return next;
  };
  const send = (raw: string) => {
    const text = raw.trim().slice(0, 300);
    if (!text || timer.current !== null) return;
    const reply = botReply(text, { products, userName: user?.name ?? null, bookings });
    const conversation = saveMessages([...msgs, { id: crypto.randomUUID(), from: "me", text }]);
    setInput("");
    setChips([]);
    setTyping(true);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setTyping(false);
      saveMessages([...conversation, { id: crypto.randomUUID(), from: "bot", text: reply.text }]);
      setChips(reply.chips ?? DEFAULT_CHIPS);
      run(reply.action);
    }, 700);
  };
  const submit = (event: FormEvent) => { event.preventDefault(); send(input); };
  const reset = () => {
    cancelReply();
    setTyping(false);
    saveMessages([greeting(user?.name ?? null)]);
    setChips(DEFAULT_CHIPS);
    setInput("");
  };

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
            <button key={c} onClick={() => send(c)} className="rounded-full border px-3 py-1 text-xs transition-colors hover:border-primary hover:text-primary">
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
