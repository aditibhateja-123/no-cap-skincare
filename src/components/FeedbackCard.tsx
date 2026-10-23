import React, { useEffect, useState } from 'react';

export const FeedbackCard: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const [rating, setRating] = useState(0);
  const [researchTime, setResearchTime] = useState('');
  const [worked, setWorked] = useState('');
  const [confused, setConfused] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  useEffect(() => {
    fetch('/api/share-status')
      .then((r) => r.json())
      .then((j) => setEnabled(Boolean(j.enabled)))
      .catch(() => setEnabled(false));
  }, []);

  if (!enabled) return null;

  const submit = async () => {
    if (!rating) return;
    setState('sending');
    try {
      const r = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, researchTime, worked, confused }),
      });
      setState(r.ok ? 'done' : 'error');
    } catch {
      setState('error');
    }
  };

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 space-y-4">
      {state === 'done' ? (
        <div>
          <h3 className="font-serif text-lg font-bold text-stone-900">Thank you</h3>
          <p className="text-sm text-stone-700 mt-1">Your feedback helps make No Cap more honest and clearer.</p>
        </div>
      ) : (
        <>
          <div>
            <h3 className="font-serif text-lg font-bold text-stone-900">How was your experience?</h3>
            <p className="text-xs text-stone-600 mt-1">
              Takes 30 seconds. Only what you type here is sent. Nothing from your quiz or photo.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Rating from 1 to 5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setRating(n)}
                aria-checked={rating === n}
                role="radio"
                className={`w-11 h-11 rounded-xl border font-bold text-sm cursor-pointer ${
                  rating === n ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-800 border-stone-300'
                }`}
              >
                {n}
              </button>
            ))}
            <span className="text-[11px] text-stone-500 ml-1">1 = not helpful, 5 = very helpful</span>
          </div>
          <div className="text-sm text-stone-800">
            Before No Cap, how long did you usually spend deciding what skincare to buy? (optional)
            <div className="flex flex-wrap gap-2 mt-2">
              {['under 10 min', '10 to 30 min', '30 to 60 min', 'over 1 hour', 'first time buying'].map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setResearchTime(researchTime === o ? '' : o)}
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                    researchTime === o ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-800 border-stone-300'
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
          <label className="block text-sm text-stone-800">
            What worked for you? (optional)
            <textarea value={worked} onChange={(e) => setWorked(e.target.value)} rows={2} maxLength={500} className="mt-1 w-full rounded-xl border border-stone-300 p-2 text-sm" />
          </label>
          <label className="block text-sm text-stone-800">
            What was confusing or missing? (optional)
            <textarea value={confused} onChange={(e) => setConfused(e.target.value)} rows={2} maxLength={500} className="mt-1 w-full rounded-xl border border-stone-300 p-2 text-sm" />
          </label>
          {state === 'error' && <p className="text-xs text-rose-700">Could not send. Please try again.</p>}
          <button
            onClick={submit}
            disabled={!rating || state === 'sending'}
            className="px-6 py-3 bg-stone-900 text-white font-bold text-sm rounded-xl cursor-pointer disabled:opacity-40"
          >
            {state === 'sending' ? 'Sending...' : 'Send feedback'}
          </button>
        </>
      )}
    </div>
  );
};
