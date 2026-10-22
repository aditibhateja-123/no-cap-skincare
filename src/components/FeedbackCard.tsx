import React, { useState } from 'react';
import { FEEDBACK } from '../feedbackConfig';

export const feedbackEnabled = Boolean(FEEDBACK.action && FEEDBACK.fields.rating);

export const FeedbackCard: React.FC = () => {
  const [rating, setRating] = useState(0);
  const [worked, setWorked] = useState('');
  const [confused, setConfused] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  if (!feedbackEnabled) return null;

  const submit = async () => {
    if (!rating) return;
    setState('sending');
    try {
      const body = new URLSearchParams();
      body.set(FEEDBACK.fields.rating, String(rating));
      if (FEEDBACK.fields.worked) body.set(FEEDBACK.fields.worked, worked.trim());
      if (FEEDBACK.fields.confused) body.set(FEEDBACK.fields.confused, confused.trim());
      await fetch(FEEDBACK.action, { method: 'POST', mode: 'no-cors', body });
      setState('done');
    } catch {
      setState('error');
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 pb-8">
      <div className="rounded-3xl border border-stone-200 bg-white p-5 space-y-4">
        {state === 'done' ? (
          <div>
            <h3 className="font-serif text-lg font-bold text-stone-900">Thank you</h3>
            <p className="text-sm text-stone-700 mt-1">Your feedback helps make No Cap more honest and clearer.</p>
          </div>
        ) : (
          <>
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900">Did this help?</h3>
              <p className="text-xs text-stone-600 mt-1">
                Takes 30 seconds. Only what you type here is sent. Nothing from your quiz or photo.
              </p>
            </div>
            <div className="flex gap-2" role="radiogroup" aria-label="Rating from 1 to 5">
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
              <span className="self-center text-[11px] text-stone-500 ml-1">1 = not helpful, 5 = very helpful</span>
            </div>
            <label className="block text-sm text-stone-800">
              What worked for you? (optional)
              <textarea
                value={worked}
                onChange={(e) => setWorked(e.target.value)}
                rows={2}
                maxLength={500}
                className="mt-1 w-full rounded-xl border border-stone-300 p-2 text-sm"
              />
            </label>
            <label className="block text-sm text-stone-800">
              What was confusing or missing? (optional)
              <textarea
                value={confused}
                onChange={(e) => setConfused(e.target.value)}
                rows={2}
                maxLength={500}
                className="mt-1 w-full rounded-xl border border-stone-300 p-2 text-sm"
              />
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
    </div>
  );
};
