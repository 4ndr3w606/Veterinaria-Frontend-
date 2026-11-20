import { useEffect, useRef, useState } from "react";
import {
  getSessionStorageItem,
  removeLocalStorageItem,
  removeSessionStorageItem,
  setSessionStorageItem,
} from "@/lib/safeStorage";
import type { Account, User } from "@/lib/types";

const SESSION_KEY = "lumina:session";

/**
 * Sesión recordada en sessionStorage: solo nombre y correo, nunca la contraseña.
 * Sobrevive a recargar la pestaña y desaparece al cerrarla.
 */
function readSession(): User | null {
  try {
    const value: unknown = JSON.parse(getSessionStorageItem(SESSION_KEY) ?? "null");
    if (typeof value !== "object" || value === null) return null;
    const { name, email } = value as Record<string, unknown>;
    if (typeof name !== "string" || !name.trim() || typeof email !== "string" || !email.includes("@")) return null;
    return { name: name.trim(), email: email.trim().toLowerCase() };
  } catch {
    return null;
  }
}

export function useAuth(onSessionChange: (email: string | null) => void) {
  // Demo: las cuentas (con contraseña) viven solo en memoria; la autenticación real se conectará aquí.
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [user, setUser] = useState<User | null>(readSession);
  const restored = useRef(user);

  useEffect(() => {
    removeLocalStorageItem("lumina:accounts");
    removeLocalStorageItem("lumina:user");
  }, []);

  // Una sesión recuperada al recargar también debe cargar las citas de esa cuenta.
  useEffect(() => {
    if (restored.current) onSessionChange(restored.current.email);
  }, [onSessionChange]);

  function startSession(account: Account) {
    const next = { name: account.name, email: account.email };
    setUser(next);
    setSessionStorageItem(SESSION_KEY, JSON.stringify(next));
    onSessionChange(account.email);
  }

  function register(name: string, email: string, pass: string): string | null {
    const mail = email.trim().toLowerCase();
    if (accounts.some((account) => account.email.toLowerCase() === mail)) {
      return "Ese correo ya tiene cuenta. Inicia sesión.";
    }
    if (pass.length < 6) return "La contraseña necesita al menos 6 caracteres.";
    const account = { name, email: mail, pass };
    setAccounts((current) => [...current, account]);
    startSession(account);
    return null;
  }

  function login(email: string, pass: string): string | null {
    const mail = email.trim().toLowerCase();
    const account = accounts.find((item) => item.email.toLowerCase() === mail && item.pass === pass);
    if (!account) return "Correo o contraseña incorrectos.";
    startSession(account);
    return null;
  }

  function logout() {
    removeSessionStorageItem(SESSION_KEY);
    onSessionChange(null);
    setUser(null);
  }

  return { user, userKey: user?.email ?? "guest", register, login, logout };
}
