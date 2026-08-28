// Preferencja dźwięku kliknięć — localStorage, domyślnie WYŁĄCZONA.
// Zdarzenie "lb-sound-pref-change" pozwala listenerowi (na dokumencie)
// i przełącznikowi (header) zsynchronizować się bez propsów/kontekstu.
const KEY = "lb_sound_enabled"

export function getSoundPref(): boolean {
  if (typeof window === "undefined") return false
  try {
    return window.localStorage.getItem(KEY) === "1"
  } catch {
    return false
  }
}

export function setSoundPref(enabled: boolean): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(KEY, enabled ? "1" : "0")
  } catch {
    /* localStorage niedostępny (tryb prywatny itp.) — preferencja nie przetrwa reloadu, nie krytyczne */
  }
  window.dispatchEvent(new CustomEvent<boolean>("lb-sound-pref-change", { detail: enabled }))
}
