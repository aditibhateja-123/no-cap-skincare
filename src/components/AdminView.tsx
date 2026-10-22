import React, { useState } from 'react';

interface Share {
  at: string;
  answers: Record<string, string | string[]>;
  scanFindings: { type: string; severity: string }[];
  scanConfidence: string;
}

const join = (v: string | string[] | undefined) => (Array.isArray(v) ? v.join(', ') : v || '');

export const AdminView: React.FC = () => {
  const [password, setPassword] = useState('');
  const [shares, setShares] = useState<Share[] | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [events, setEvents] = useState<Record<string, Record<string, number>>>({});

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/admin/shares', { headers: { 'x-admin-password': password } });
      const j = await r.json();
      if (!r.ok) setError(j.error || 'Could not load.');
      else {
        setShares(j.shares);
        try {
          const e = await fetch('/api/admin/events', { headers: { 'x-admin-password': password } });
          if (e.ok) setEvents((await e.json()).counts || {});
        } catch {
          /* funnel is optional */
        }
      }
    } catch {
      setError('Could not load.');
    }
    setLoading(false);
  };

  const count = (key: string) => {
    const m: Record<string, number> = {};
    (shares || []).forEach((s) => {
      const v = s.answers[key];
      (Array.isArray(v) ? v : [v]).filter(Boolean).forEach((x) => (m[x as string] = (m[x as string] || 0) + 1));
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  };

  const FUNNEL: [string, string][] = [
    ['open', 'Opened the app'],
    ['choose_routine', 'Chose "Get my full routine"'],
    ['choose_sunscreen', 'Chose "Find a sunscreen"'],
    ['choose_concern', 'Chose "I know my concern"'],
    ['quiz_done', 'Finished the quiz'],
    ['scan_done', 'Did a face scan'],
    ['results_viewed', 'Saw their results'],
    ['checkin_started', 'Started a check-in plan'],
    ['share_clicked', 'Tapped Share'],
  ];
  const stepTotal = (name: string, days?: number) => {
    const cutoff = days ? new Date(Date.now() - days * 86400000).toISOString().slice(0, 10) : '';
    return Object.entries(events).reduce((sum, [day, c]) => (day >= cutoff ? sum + (c[name] || 0) : sum), 0);
  };

  if (!shares) {
    return (
      <div className="max-w-sm mx-auto px-4 py-16 space-y-3">
        <h1 className="font-serif text-2xl font-bold">Team view</h1>
        <p className="text-sm text-stone-600">Results people chose to share. Password needed.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
          placeholder="Password"
          className="w-full rounded-xl border border-stone-300 p-3 text-sm"
        />
        {error && <p className="text-xs text-rose-700">{error}</p>}
        <button onClick={load} disabled={!password || loading} className="px-6 py-3 bg-stone-900 text-white font-bold text-sm rounded-xl cursor-pointer disabled:opacity-40">
          {loading ? 'Loading...' : 'Open'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">Shared results ({shares.length})</h1>
        <p className="text-xs text-stone-600">No photos, names or contact details. Newest first.</p>
      </div>
      <div className="rounded-2xl border border-stone-200 bg-white p-4">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-bold text-stone-900">User journey (anonymous step counts)</h2>
          <span className="text-[11px] text-stone-500">Each person is counted once per step per visit</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-stone-500">
              <th className="py-1">Step</th><th className="py-1 text-right">Today</th><th className="py-1 text-right">Last 7 days</th><th className="py-1 text-right">All time</th>
            </tr>
          </thead>
          <tbody>
            {FUNNEL.map(([name, label]) => {
              const all = stepTotal(name);
              const max = Math.max(1, stepTotal('open'));
              return (
                <tr key={name} className="border-t border-stone-100">
                  <td className="py-1.5">
                    <div>{label}</div>
                    <div className="h-1.5 mt-1 rounded bg-stone-100"><div className="h-1.5 rounded bg-stone-900" style={{ width: Math.min(100, (all / max) * 100) + '%' }} /></div>
                  </td>
                  <td className="py-1.5 text-right font-bold">{events[new Date().toISOString().slice(0, 10)]?.[name] || 0}</td>
                  <td className="py-1.5 text-right font-bold">{stepTotal(name, 7)}</td>
                  <td className="py-1.5 text-right font-bold">{all}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {Object.keys(events).length === 0 && <p className="text-xs text-stone-500 mt-2">No steps counted yet. They appear as people use the app.</p>}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {['ageRange', 'skinTone', 'concerns', 'budget'].map((k) => (
          <div key={k} className="rounded-2xl border border-stone-200 bg-white p-4">
            <div className="text-[11px] uppercase tracking-wider font-bold text-stone-500 mb-2">{k}</div>
            {count(k).map(([name, n]) => (
              <div key={name} className="flex justify-between text-sm"><span>{name}</span><span className="font-bold">{n}</span></div>
            ))}
          </div>
        ))}
      </div>
      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
        <table className="w-full text-xs">
          <thead className="bg-stone-100 text-left">
            <tr>{['When', 'Age', 'Skin tone', 'Midday', 'Concerns', 'Breakouts', 'Marks', 'Sensitive', 'Budget', 'Scan found'].map((h) => <th key={h} className="p-2 whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody>
            {shares.map((s, i) => (
              <tr key={i} className="border-t border-stone-100 align-top">
                <td className="p-2 whitespace-nowrap">{new Date(s.at).toLocaleString('en-IN')}</td>
                <td className="p-2">{join(s.answers.ageRange)}</td>
                <td className="p-2">{join(s.answers.skinTone)}</td>
                <td className="p-2">{join(s.answers.middayFeel)}</td>
                <td className="p-2">{join(s.answers.concerns)}</td>
                <td className="p-2">{join(s.answers.breakoutLevel)}</td>
                <td className="p-2">{join(s.answers.marksDuration)}</td>
                <td className="p-2">{join(s.answers.sensitivity)}</td>
                <td className="p-2">{join(s.answers.budget)}</td>
                <td className="p-2">{s.scanFindings.map((f) => `${f.type.replace(/_/g, ' ')} (${f.severity})`).join(', ') || 'no scan'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
