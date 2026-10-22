import React, { useEffect, useState } from 'react';
import { track } from '../analytics';
import { FeedbackCard } from './FeedbackCard';

interface Props {
  hasResults: boolean;
  hasPlan: boolean;
  onOpenCheckins: () => void;
  onStartOver: () => void;
  onHome: () => void;
}

const SHARE_URL = 'https://no-cap-skincare.vercel.app';

export const DoneView: React.FC<Props> = ({ hasResults, hasPlan, onOpenCheckins, onStartOver, onHome }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    track('finished');
  }, []);

  const shareApp = async () => {
    const text = 'No Cap: honest skincare picks with real Nykaa products. ' + SHARE_URL;
    if (typeof navigator.share === 'function') {
      navigator.share({ text }).catch(() => {});
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">You’re all set</h1>
        <p className="text-sm text-stone-600">
          {hasResults ? 'Here is what to do from here. That is the whole journey.' : 'Thanks for trying No Cap.'}
        </p>
      </div>

      <div className="rounded-3xl border border-stone-200 bg-white p-5 space-y-3">
        <h2 className="font-bold text-stone-900">Your next few days</h2>
        <ol className="list-decimal pl-5 space-y-2 text-sm text-stone-800">
          <li>Try one new product at a time. Test it on a small patch, such as your jaw, for 24 hours first.</li>
          <li>Wear sunscreen every morning. For marks after acne, it matters most.</li>
          <li>
            Give it six weeks before judging.{' '}
            {hasPlan ? (
              <button onClick={onOpenCheckins} className="underline font-semibold cursor-pointer">
                See your check-in dates
              </button>
            ) : (
              'Come back then and take the quiz again to compare.'
            )}
          </li>
          <li>If a product burns, swells or gives you a rash, stop using it and see a doctor.</li>
        </ol>
      </div>

      <FeedbackCard />

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={shareApp} className="px-6 py-3 bg-stone-900 text-white font-bold text-sm rounded-xl cursor-pointer">
          {copied ? 'Link copied' : 'Share No Cap with a friend'}
        </button>
        <button onClick={onStartOver} className="px-6 py-3 bg-white text-stone-900 border border-stone-300 font-bold text-sm rounded-xl cursor-pointer">
          Start over
        </button>
        <button onClick={onHome} className="px-6 py-3 bg-white text-stone-900 border border-stone-300 font-bold text-sm rounded-xl cursor-pointer">
          Back to home
        </button>
      </div>
      <p className="text-center text-xs text-stone-500">Guidance, not medical advice.</p>
    </div>
  );
};
