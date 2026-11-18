import { useEffect, useState } from "react";
import { removeLocalStorageItem } from "@/lib/safeStorage";
import type { Account, User } from "@/lib/types";

export function useAuth(onSessionChange: (email: string | null) => void) {
  // Demo en memoria: la autenticación real se conectará aquí.
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    removeLocalStorageItem("lumina:accounts");
    removeLocalStorageItem("lumina:user");
  }, []);

  function startSession(account: Account) {
    setUser({ name: account.name, email: account.email });
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
    onSessionChange(null);
    setUser(null);
  }

  return { user, userKey: user?.email ?? "guest", register, login, logout };
}
