// The selected store id is a per-browser convenience; the backend is the
// source of truth for which stores exist.
const STORE_KEY = 'rma.store';

export function rememberStore(id: string | null) {
  try {
    if (id) localStorage.setItem(STORE_KEY, id);
    else localStorage.removeItem(STORE_KEY);
  } catch {
    // Storage unavailable (private mode): the session still works.
  }
}

export function rememberedStore(): string | null {
  try {
    return localStorage.getItem(STORE_KEY);
  } catch {
    return null;
  }
}
