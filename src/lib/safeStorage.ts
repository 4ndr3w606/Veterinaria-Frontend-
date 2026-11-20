export function getLocalStorageItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setLocalStorageItem(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeLocalStorageItem(key: string): boolean {
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

// sessionStorage: dura mientras la pestaña esté abierta (sobrevive a recargar, no a cerrarla).
export function getSessionStorageItem(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setSessionStorageItem(key: string, value: string): boolean {
  try {
    window.sessionStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeSessionStorageItem(key: string): boolean {
  try {
    window.sessionStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/** Lee JSON persistido o usa el valor inicial si no existe o no se puede leer. */
export function readLocalStorageJson<T>(key: string, fallback: T): T {
  try {
    return (JSON.parse(getLocalStorageItem(key) ?? "") as T) ?? fallback;
  } catch {
    return fallback;
  }
}
