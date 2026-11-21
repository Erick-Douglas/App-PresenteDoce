import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";
export type Appearance = "light" | "dark" | "system";
const key = "presente-doce:appearance";
const Context = createContext<{
  choice: Appearance;
  resolved: "light" | "dark";
  setChoice: (choice: Appearance) => void;
} | null>(null);
function read(): Appearance {
  try {
    const v = localStorage.getItem(key);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}
export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [choice, setChoiceState] = useState(read),
    [systemDark, setSystemDark] = useState(
      () => matchMedia("(prefers-color-scheme: dark)").matches,
    );
  const resolved =
    choice === "system" ? (systemDark ? "dark" : "light") : choice;
  useEffect(() => {
    const query = matchMedia("(prefers-color-scheme: dark)"),
      change = () => setSystemDark(query.matches),
      storage = (e: StorageEvent) => {
        if (e.key === key || e.key === null) setChoiceState(read());
      };
    query.addEventListener("change", change);
    window.addEventListener("storage", storage);
    return () => {
      query.removeEventListener("change", change);
      window.removeEventListener("storage", storage);
    };
  }, []);
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = resolved;
    root.dataset.appearance = choice;
    root.style.colorScheme = resolved;
    window.dispatchEvent(new Event("presente-doce:appearance"));
  }, [choice, resolved]);
  function setChoice(v: Appearance) {
    setChoiceState(v);
    try {
      localStorage.setItem(key, v);
    } catch {}
  }
  return (
    <Context.Provider value={{ choice, resolved, setChoice }}>
      {children}
    </Context.Provider>
  );
}
export function useAppearance() {
  const context = useContext(Context);
  if (!context) throw Error("Aparência não carregada.");
  return context;
}
