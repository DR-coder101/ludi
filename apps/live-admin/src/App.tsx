import { useEffect, useMemo, useState } from 'react';
import { parseQuery } from './connect/query.js';
import { DashboardScreen } from './screens/DashboardScreen.js';
import { ErrorScreen } from './screens/ErrorScreen.js';
import { KickModal } from './screens/KickModal.js';
import { SettingsScreen } from './screens/SettingsScreen.js';
import { SetupScreen } from './screens/SetupScreen.js';
import { Shell } from './screens/Shell.js';
import { demoFrame } from './view/fixtures.js';
import type { AdminDemoId, AdminView } from './view/types.js';

export function App() {
  const query = useMemo(() => parseQuery(window.location.search), []);
  const [live, setLive] = useState<AdminView | null>(null);

  useEffect(() => {
    if (query.demo) return;
    let cancelled = false;
    const pull = async () => {
      try {
        const res = await fetch('/api/state');
        if (!res.ok || cancelled) return;
        setLive((await res.json()) as AdminView);
      } catch {
        return;
      }
    };
    void pull();
    const id = window.setInterval(pull, 400);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [query.demo]);

  const view = query.demo ? demoFrame(query.demo) : (live ?? demoFrame('setup'));
  const screen: AdminDemoId | 'live' = query.demo ?? 'live';
  return (
    <Shell view={view} screen={screen}>
      {view.error ? <ErrorScreen error={view.error} /> : null}
      {!view.error && view.nav === 'setup' ? <SetupScreen view={view} /> : null}
      {!view.error && view.nav === 'settings' ? <SettingsScreen view={view} /> : null}
      {!view.error && view.nav === 'dashboard' ? <DashboardScreen view={view} /> : null}
      {view.kick ? <KickModal kick={view.kick} /> : null}
    </Shell>
  );
}
