import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { analyze, type Profile } from "./loan";
import { predict } from "./model";

export interface HistoryItem {
  id: string;
  date: string;
  profile: Profile;
  score: number;
  risk: string;
  probability: number;
}
export interface Scenario { id: string; name: string; profile: Profile }

interface Store {
  ready: boolean;
  current: Profile | null;
  history: HistoryItem[];
  scenarios: Scenario[];
  setCurrent: (p: Profile) => void;
  saveToHistory: (p: Profile) => void;
  removeHistory: (id: string) => void;
  clearHistory: () => void;
  addScenario: (name: string, p: Profile) => void;
  removeScenario: (id: string) => void;
  clearScenarios: () => void;
}

const Ctx = createContext<Store | null>(null);
const KEY = "loanlens.v1";
const uid = () => Math.random().toString(36).slice(2, 10);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [current, setCurrentState] = useState<Profile | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        setCurrentState(d.current ?? null);
        setHistory(d.history ?? []);
        setScenarios(d.scenarios ?? []);
      }
    } catch { /* ignore corrupt storage */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify({ current, history, scenarios }));
  }, [ready, current, history, scenarios]);

  const setCurrent = useCallback((p: Profile) => setCurrentState(p), []);
  const saveToHistory = useCallback((p: Profile) => {
    const a = analyze(p);
    const pr = predict(p);
    setHistory((h) => [{ id: uid(), date: new Date().toISOString(), profile: p, score: a.score, risk: a.risk, probability: pr.probability }, ...h].slice(0, 50));
  }, []);

  return (
    <Ctx.Provider value={{
      ready, current, history, scenarios, setCurrent, saveToHistory,
      removeHistory: (id) => setHistory((h) => h.filter((x) => x.id !== id)),
      clearHistory: () => setHistory([]),
      addScenario: (name, p) => setScenarios((s) => [...s, { id: uid(), name, profile: p }].slice(-6)),
      removeScenario: (id) => setScenarios((s) => s.filter((x) => x.id !== id)),
      clearScenarios: () => setScenarios([]),
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore outside provider");
  return c;
}
