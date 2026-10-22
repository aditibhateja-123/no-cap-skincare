import React, { useEffect, useState } from 'react';
import type { UserQuizAnswers, PhotoAnalysisResult } from '../types';

interface Props {
  answers: UserQuizAnswers;
  photoResult: PhotoAnalysisResult | null;
}

export const ShareResultsCard: React.FC<Props> = ({ answers, photoResult }) => {
  const [enabled, setEnabled] = useState(false);
  const [agree, setAgree] = useState(false);
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  useEffect(() => {
    fetch('/api/share-status')
      .then((r) => r.json())
      .then((j) => setEnabled(Boolean(j.enabled)))
      .catch(() => setEnabled(false));
  }, []);

  if (!enabled || answers.ageRange === 'under 18') return null;

  const send = async () => {
    setState('sending');
    try {
      const usable = photoResult && photoResult.image_ok && photoResult.confidence !== 'low';
      const r = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consent: true,
          answers,
          scanFindings: usable
            ? photoResult!.findings
                .filter((f) => f.enabled !== false && f.severity !== 'none')
                .map((f) => ({ type: f.type, severity: f.severity }))
            : [],
          scanConfidence: usable ? photoResult!.confidence : '',
        }),
      });
      setState(r.ok ? 'done' : 'error');
    } catch {
      setState('error');
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 pb-8">
      <div className="rounded-3xl border border-stone-200 bg-white p-5 space-y-3">
        {state === 'done' ? (
          <p className="text-sm text-stone-800">Shared. Thank you, this helps us check that the picks make sense.</p>
        ) : (
          <>
            <h3 className="font-serif text-lg font-bold text-stone-900">Want to help us improve? (optional)</h3>
            <p className="text-xs text-stone-600">
              You can share your quiz answers and what the scan found with the No Cap team. We never receive your photo,
              name or contact details. Sharing is off unless you tick the box.
            </p>
            <label className="flex items-start gap-2 text-sm text-stone-800 cursor-pointer">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1" />
              <span>Yes, share my quiz answers and scan findings, without my photo or name.</span>
            </label>
            {state === 'error' && <p className="text-xs text-rose-700">Could not share. Please try again.</p>}
            <button
              onClick={send}
              disabled={!agree || state === 'sending'}
              className="px-6 py-3 bg-stone-900 text-white font-bold text-sm rounded-xl cursor-pointer disabled:opacity-40"
            >
              {state === 'sending' ? 'Sharing...' : 'Share'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
