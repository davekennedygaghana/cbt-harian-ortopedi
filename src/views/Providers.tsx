'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fullBank } from '../lib/bank';
import { todayStr } from '../lib/daily';
import { ensureDay, loadState, saveState } from '../lib/store';
import type { AppState, Question } from '../lib/types';

interface Ctx {
  state: AppState;
  /** perbarui state; otomatis tersimpan ke localStorage */
  set: (fn: (s: AppState) => AppState) => void;
  bank: Question[];
  map: Map<string, Question>;
  today: string;
  /** false bila penyimpanan browser gagal */
  saveOk: boolean;
}

const AppCtx = createContext<Ctx | null>(null);

export function useApp(): Ctx {
  const c = useContext(AppCtx);
  if (!c) throw new Error('useApp harus dipakai di dalam <Providers>');
  return c;
}

export function Providers({ children }: { children: ReactNode }) {
  // State dimuat di browser saja (localStorage tidak ada saat prerender).
  const [state, setState] = useState<AppState | null>(null);
  const [today, setToday] = useState(todayStr);
  const [saveOk, setSaveOk] = useState(true);

  const bank = useMemo(() => fullBank(state?.custom ?? []), [state?.custom]);
  const map = useMemo(() => new Map(bank.map(q => [q.id, q])), [bank]);

  useEffect(() => {
    const s = loadState();
    setState(ensureDay(s, todayStr(), fullBank(s.custom)));
    const t = setInterval(() => setToday(todayStr()), 30_000); // ganti hari saat tab tetap terbuka
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setState(s => (s ? ensureDay(s, today, bank) : s));
  }, [today, bank]);

  useEffect(() => {
    if (state) setSaveOk(saveState(state));
  }, [state]);

  const set = useCallback((fn: (s: AppState) => AppState) => setState(prev => (prev ? fn(prev) : prev)), []);

  if (!state || !state.days[today]) {
    return (
      <div className="wrap">
        <p className="muted">Menyiapkan paket hari ini…</p>
      </div>
    );
  }

  return (
    <AppCtx.Provider value={{ state, set, bank, map, today, saveOk }}>{children}</AppCtx.Provider>
  );
}
