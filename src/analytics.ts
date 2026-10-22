// Anonymous step counts. Sends only the step name. No ids, answers or photos.
// Each step is counted once per browser tab session, so the numbers are people-visits, not clicks.
export type StepName =
  | 'open'
  | 'choose_routine'
  | 'choose_sunscreen'
  | 'choose_concern'
  | 'quiz_done'
  | 'scan_done'
  | 'results_viewed'
  | 'checkin_started'
  | 'share_clicked'
  | 'finished';

export function track(name: StepName) {
  try {
    const key = 'nocap_step_' + name;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch {
    /* storage unavailable: still count */
  }
  try {
    fetch('/api/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}
