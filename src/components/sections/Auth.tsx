import { useState } from "react";
import { LogOut, PawPrint, ShoppingBag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";

/** Barra flotante: cuenta + carrito. Colócala una vez en App. */
export function AccountBar({ className = "" }: { className?: string }) {
  const { user, logout, setAuthOpen, setCartOpen, count } = useStore();
  return (
    <div className={`flex items-center gap-2 rounded-full border bg-card/80 p-1.5 backdrop-blur-md ${className}`}>
      {user ? (
        <>
          <span className="px-3 text-sm">Hola, <span className="font-display italic text-primary">{user.name.split(" ")[0]}</span></span>
          <Button size="icon" variant="ghost" className="rounded-full" onClick={logout} aria-label="Salir"><LogOut /></Button>
        </>
      ) : (
        <Button size="sm" className="rounded-full" onClick={() => setAuthOpen(true)}><PawPrint /> Entrar</Button>
      )}
      <Button size="icon" variant="secondary" className="relative rounded-full" onClick={() => setCartOpen(true)} aria-label="Carrito">
        <ShoppingBag />
        {count > 0 && <span key={count} className="bubble absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground">{count}</span>}
      </Button>
    </div>
  );
}

export function AuthModal() {
  const { authOpen, setAuthOpen, login, register } = useStore();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [err, setErr] = useState<string | null>(null);
  if (!authOpen) return null;

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")), pass = String(f.get("pass"));
    const r = mode === "in" ? login(email, pass) : register(String(f.get("name")), email, pass);
    setErr(r);
    if (!r) setAuthOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-5 backdrop-blur-md" onClick={() => setAuthOpen(false)}>
      <div className="enter glow-card relative w-full max-w-md rounded-3xl border bg-card p-8" onClick={(e) => e.stopPropagation()}
        onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`); e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`); }}>
        <button className="absolute top-4 right-4 text-muted-foreground hover:text-primary" onClick={() => setAuthOpen(false)} aria-label="Cerrar"><X /></button>
        <span className="float mx-auto flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground"><PawPrint /></span>
        <h3 className="mt-4 text-center text-3xl font-light">{mode === "in" ? "Qué bueno verte de nuevo" : "Crea tu cuenta"}</h3>
        <form key={mode} onSubmit={submit} className="mt-6 space-y-4">
          {mode === "up" && <div className="enter space-y-2" style={{ "--i": 0 } as React.CSSProperties}><Label htmlFor="name">Tu nombre</Label><Input id="name" name="name" required className="h-12 rounded-xl" /></div>}
          <div className="enter space-y-2" style={{ "--i": 1 } as React.CSSProperties}><Label htmlFor="em">Correo</Label><Input id="em" name="email" type="email" required className="h-12 rounded-xl" /></div>
          <div className="enter space-y-2" style={{ "--i": 2 } as React.CSSProperties}><Label htmlFor="pw">Contraseña</Label><Input id="pw" name="pass" type="password" required className="h-12 rounded-xl" /></div>
          {err && <p role="alert" className="bubble text-sm text-destructive">{err}</p>}
          <Button type="submit" size="lg" className="w-full rounded-full">{mode === "in" ? "Entrar" : "Crear cuenta"}</Button>
        </form>
        <button className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-primary" onClick={() => { setErr(null); setMode(mode === "in" ? "up" : "in"); }}>
          {mode === "in" ? "¿Primera vez? Crea tu cuenta" : "¿Ya tienes cuenta? Entra"}
        </button>
      </div>
    </div>
  );
}