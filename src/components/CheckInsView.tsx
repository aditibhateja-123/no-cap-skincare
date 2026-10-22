import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  Download,
  Trash2,
  Clock,
  ArrowRight,
  ShieldAlert,
  Info,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  CheckInPlan,
  CheckInAnswers,
  CheckInEvaluation,
  CompletedCheckIn,
  WeekendCheckRecord,
  TimelinePhotoItem,
  UserQuizAnswers,
} from '../types';
import {
  evaluateCheckIn,
  getWeekendCheckStatus,
  calculateWeekendStreak,
} from '../utils/skincareRules';
import {
  getTimelinePhotosForPlan,
  deleteTimelinePhoto,
  deleteAllTimelinePhotos,
} from '../utils/photoStorage';
import { WeekendCheckModal } from './WeekendCheckModal';
import { TimelineView } from './TimelineView';

interface CheckInsViewProps {
  plans: CheckInPlan[];
  onDeletePlan: (id: string) => void;
  onSaveCompletedCheckIn: (planId: string, checkIn: CompletedCheckIn) => void;
  onNewScan: () => void;
  userAnswers?: UserQuizAnswers | null;
}

export function computeDueStatus(dueDateStr: string): {
  status: 'Due now' | 'Due in N days' | 'Overdue';
  label: string;
  diffDays: number;
} {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [y, m, d] = dueDateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return {
      status: 'Due in N days',
      label: `Due in ${diffDays} day${diffDays === 1 ? '' : 's'}`,
      diffDays,
    };
  } else if (diffDays === 0) {
    return {
      status: 'Due now',
      label: 'Due now',
      diffDays,
    };
  } else {
    return {
      status: 'Overdue',
      label: 'Overdue',
      diffDays,
    };
  }
}

export function escapeIcsText(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

export function downloadCheckInIcs(plan: CheckInPlan) {
  const now = new Date();
  const dtstamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}T${String(now.getUTCHours()).padStart(2, '0')}${String(now.getUTCMinutes()).padStart(2, '0')}${String(now.getUTCSeconds()).padStart(2, '0')}Z`;

  const formatIcsLocalDate = (year: number, month: number, day: number) => {
    return `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`;
  };

  const events = [
    {
      week: 2,
      date: plan.dueDates.week2,
      title: 'No Cap Skincare Check-in: Week 2',
      desc: 'Check stinging, tolerance, and starting your first active every other night.',
    },
    {
      week: 6,
      date: plan.dueDates.week6,
      title: 'No Cap Skincare Check-in: Week 6',
      desc: 'Review skin barrier, mark fading, and optional second active introduction.',
    },
    {
      week: 12,
      date: plan.dueDates.week12,
      title: 'No Cap Skincare Check-in: Week 12',
      desc: '12-week comprehensive skincare evaluation.',
    },
  ];

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//No Cap Skincare//Check-ins//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  events.forEach((ev) => {
    const [y, m, d] = ev.date.split('-').map(Number);
    const start = formatIcsLocalDate(y, m, d);
    const nextDay = new Date(y, m - 1, d + 1);
    const end = formatIcsLocalDate(
      nextDay.getFullYear(),
      nextDay.getMonth() + 1,
      nextDay.getDate()
    );

    icsLines.push(
      'BEGIN:VEVENT',
      `UID:nocap-${plan.id}-w${ev.week}@nocap.local`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${escapeIcsText(ev.title)}`,
      `DESCRIPTION:${escapeIcsText(ev.desc)}`,
      'END:VEVENT'
    );
  });

  // Weekly all-day recurring event: "No Cap weekend check" every Saturday for 12 weeks
  const [startY, startM, startD] = plan.startDate.split('-').map(Number);
  const startDate = new Date(startY, startM - 1, startD);
  const dayOfWeek = startDate.getDay(); // 0 is Sunday, 6 is Saturday
  const daysUntilSat = (6 - dayOfWeek + 7) % 7;
  const firstSat = new Date(startY, startM - 1, startD + daysUntilSat);

  const satStart = formatIcsLocalDate(
    firstSat.getFullYear(),
    firstSat.getMonth() + 1,
    firstSat.getDate()
  );
  const nextDayAfterSat = new Date(
    firstSat.getFullYear(),
    firstSat.getMonth(),
    firstSat.getDate() + 1
  );
  const satEnd = formatIcsLocalDate(
    nextDayAfterSat.getFullYear(),
    nextDayAfterSat.getMonth() + 1,
    nextDayAfterSat.getDate()
  );

  icsLines.push(
    'BEGIN:VEVENT',
    `UID:nocap-${plan.id}-weekend-weekly@nocap.local`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;VALUE=DATE:${satStart}`,
    `DTEND;VALUE=DATE:${satEnd}`,
    'RRULE:FREQ=WEEKLY;COUNT=12;BYDAY=SA',
    `SUMMARY:${escapeIcsText('No Cap weekend check')}`,
    `DESCRIPTION:${escapeIcsText('10-second weekly habit to check your routine')}`,
    'END:VEVENT'
  );

  icsLines.push('END:VCALENDAR');

  const icsContent = icsLines.join('\r\n');
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `nocap-checkins-${plan.id}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const WEEKEND_CHECKS_STORAGE_KEY = 'nocap_weekend_checks_v1';

export const CheckInsView: React.FC<CheckInsViewProps> = ({
  plans,
  onDeletePlan,
  onSaveCompletedCheckIn,
  onNewScan,
  userAnswers,
}) => {
  const [activePlanForCheckIn, setActivePlanForCheckIn] = useState<CheckInPlan | null>(null);
  const [activeWeekForCheckIn, setActiveWeekForCheckIn] = useState<2 | 6 | 12 | null>(null);

  // Weekend checks state
  const [weekendChecks, setWeekendChecks] = useState<WeekendCheckRecord[]>([]);
  const [activeWeekendCheckPlan, setActiveWeekendCheckPlan] = useState<CheckInPlan | null>(null);
  const [photosByPlan, setPhotosByPlan] = useState<Record<string, TimelinePhotoItem[]>>({});

  // Load saved weekend checks on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(WEEKEND_CHECKS_STORAGE_KEY);
      if (stored) {
        setWeekendChecks(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  // Load photos for a plan
  const loadPhotosForPlan = useCallback(async (planId: string) => {
    const photos = await getTimelinePhotosForPlan(planId);
    setPhotosByPlan((prev) => ({ ...prev, [planId]: photos }));
  }, []);

  // Load photos for all plans
  useEffect(() => {
    plans.forEach((p) => {
      loadPhotosForPlan(p.id);
    });
  }, [plans, loadPhotosForPlan]);

  const handleSaveWeekendCheck = (record: WeekendCheckRecord) => {
    const updated = [record, ...weekendChecks];
    setWeekendChecks(updated);
    try {
      localStorage.setItem(WEEKEND_CHECKS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    loadPhotosForPlan(record.planId);
  };

  const handleDeletePhoto = async (planId: string, photoId: string) => {
    await deleteTimelinePhoto(photoId);
    loadPhotosForPlan(planId);
  };

  const handleDeleteAllPhotos = async (planId: string) => {
    await deleteAllTimelinePhotos(planId);
    loadPhotosForPlan(planId);
  };

  // Form states - start unanswered
  const [overall, setOverall] = useState<'better' | 'the same' | 'worse' | null>(null);
  const [marks, setMarks] = useState<'lighter' | 'the same' | 'darker' | 'I have none' | null>(null);
  const [breakouts, setBreakouts] = useState<'fewer' | 'the same' | 'more' | 'I have no breakouts' | null>(null);
  const [irritation, setIrritation] = useState<'no' | 'mild stinging' | 'burning, swelling or rash' | null>(null);
  const [sunscreen, setSunscreen] = useState<'most days' | 'some days' | 'rarely' | null>(null);
  const [addedNewActive, setAddedNewActive] = useState<'no' | 'yes' | null>(null);

  // Modal / Evaluation view state
  const [currentEvaluation, setCurrentEvaluation] = useState<{
    plan: CheckInPlan;
    week: 2 | 6 | 12;
    evaluation: CheckInEvaluation;
  } | null>(null);

  const startCheckIn = (plan: CheckInPlan, week: 2 | 6 | 12) => {
    // Prefill from the last Weekend check: skin feel Calmer maps to irritation "no", More irritated maps to "mild stinging".
    // Do not prefill other answers.
    const planWeekendRecords = weekendChecks.filter((r) => r.planId === plan.id);
    const latestWeekendCheck = planWeekendRecords.length > 0
      ? [...planWeekendRecords].sort((a, b) => b.date.localeCompare(a.date))[0]
      : null;

    let prefilledIrritation: 'no' | 'mild stinging' | 'burning, swelling or rash' | null = null;
    if (latestWeekendCheck) {
      if (latestWeekendCheck.answers.skinFeel === 'Calmer') {
        prefilledIrritation = 'no';
      } else if (latestWeekendCheck.answers.skinFeel === 'More irritated') {
        prefilledIrritation = 'mild stinging';
      }
    }

    setActivePlanForCheckIn(plan);
    setActiveWeekForCheckIn(week);
    setOverall(null);
    setMarks(null);
    setBreakouts(null);
    setIrritation(prefilledIrritation);
    setSunscreen(null);
    setAddedNewActive(null);
    setCurrentEvaluation(null);
  };

  const isFormComplete =
    overall !== null &&
    marks !== null &&
    breakouts !== null &&
    irritation !== null &&
    sunscreen !== null &&
    addedNewActive !== null;

  const handleSubmitCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlanForCheckIn || !activeWeekForCheckIn || !isFormComplete) return;

    const answers: CheckInAnswers = {
      overall: overall!,
      marks: marks!,
      breakouts: breakouts!,
      irritation: irritation!,
      sunscreen: sunscreen!,
      addedNewActive: addedNewActive!,
    };

    const evaluation = evaluateCheckIn(activePlanForCheckIn, activeWeekForCheckIn, answers);

    const completed: CompletedCheckIn = {
      week: activeWeekForCheckIn,
      date: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      answers,
      evaluation,
    };

    onSaveCompletedCheckIn(activePlanForCheckIn.id, completed);

    setCurrentEvaluation({
      plan: activePlanForCheckIn,
      week: activeWeekForCheckIn,
      evaluation,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-stone-500">
            Progress Tracking
          </span>
          <h1 className="font-serif text-3xl font-bold text-stone-900 mt-1">
            Skincare Check-in Plans
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Evaluate your routine at week 2, 6, and 12. Stored on this device only. No photos or typed text saved.
          </p>
        </div>

        <button
          onClick={onNewScan}
          className="self-start sm:self-auto px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
        >
          Match New Routine
        </button>
      </div>

      {/* No Plans State */}
      {plans.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 text-stone-600 flex items-center justify-center mx-auto">
            <Calendar className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="font-serif text-xl font-bold text-stone-900">
              No Active Check-in Plans
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              When you complete the quiz and view your product matches, click{' '}
              <strong className="text-stone-700">"Start a check-in plan"</strong> to track your progress at weeks 2, 6, and 12.
            </p>
          </div>
          <button
            onClick={onNewScan}
            className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Start Quiz
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {plans.map((plan) => {
            const completedWeeks = (plan.completedCheckIns || []).map((c) => c.week);

            // Determine next check-in
            let nextMilestone: { week: 2 | 6 | 12; dueDate: string } | null = null;
            if (!completedWeeks.includes(2)) {
              nextMilestone = { week: 2, dueDate: plan.dueDates.week2 };
            } else if (!completedWeeks.includes(6)) {
              nextMilestone = { week: 6, dueDate: plan.dueDates.week6 };
            } else if (!completedWeeks.includes(12)) {
              nextMilestone = { week: 12, dueDate: plan.dueDates.week12 };
            }

            const dueInfo = nextMilestone ? computeDueStatus(nextMilestone.dueDate) : null;

            return (
              <div
                key={plan.id}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-xs space-y-6"
              >
                {/* Plan Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-stone-100">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-stone-900">
                        Plan Started: {plan.startDate}
                      </span>
                      <span className="text-stone-300">·</span>
                      <span className="text-xs text-stone-500 font-medium">
                        {plan.basicsOnly ? 'Basics Only Mode' : 'Active Routine'}
                      </span>
                    </div>

                    <div className="text-xs text-stone-600">
                      <strong>Concerns: </strong>
                      {plan.concerns.length > 0 ? plan.concerns.join(', ') : 'Daily barrier upkeep'}
                    </div>

                    {plan.firstActiveName && (
                      <div className="text-xs text-stone-600">
                        <strong>First Active: </strong>
                        {plan.firstActiveName}
                        {plan.secondActiveName && (
                          <span> · <strong>Week 6 Active: </strong>{plan.secondActiveName}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => downloadCheckInIcs(plan)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-50 hover:bg-stone-100 text-stone-800 border border-stone-200 transition-colors cursor-pointer"
                        title="Download calendar (.ics) reminders for Weeks 2, 6 and 12, plus weekly Saturday reminders"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download reminders (.ics)</span>
                      </button>
                      <span className="text-[11px] text-stone-500">
                        Put it in your phone calendar so it reminds you.
                      </span>
                    </div>

                    <button
                      onClick={() => onDeletePlan(plan.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete this plan</span>
                    </button>
                  </div>
                </div>

                {/* Weekend Check Card (10-second weekly habit) */}
                {(() => {
                  const planWeekendRecords = weekendChecks.filter((r) => r.planId === plan.id);
                  const latestWeekendCheck = planWeekendRecords.length > 0
                    ? [...planWeekendRecords].sort((a, b) => b.date.localeCompare(a.date))[0]
                    : null;
                  const weekendStatus = getWeekendCheckStatus(latestWeekendCheck?.date);
                  const streak = calculateWeekendStreak(planWeekendRecords);

                  return (
                    <div
                      onClick={() => setActiveWeekendCheckPlan(plan)}
                      className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:border-amber-300 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-stone-900 text-amber-200 flex items-center justify-center font-bold shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                          <Sparkles className="w-5 h-5 text-amber-200" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-serif font-bold text-sm sm:text-base text-stone-900">
                              Weekend Check
                            </h3>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-200 text-amber-950">
                              10-second habit
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600 mt-0.5">
                            <span
                              className={`font-semibold ${
                                weekendStatus.isReady ? 'text-amber-950' : 'text-stone-700'
                              }`}
                            >
                              {weekendStatus.label}
                            </span>
                            {streak > 0 && (
                              <>
                                <span className="text-stone-300">·</span>
                                <span className="font-semibold text-amber-900">
                                  {streak === 1 ? '1 weekend check completed' : `${streak} weekends in a row`}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveWeekendCheckPlan(plan);
                        }}
                        className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-semibold bg-stone-900 group-hover:bg-stone-800 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <span>Do 10-second check</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })()}

                {/* Next Check-in Status Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-amber-800 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-amber-950">Next Check-in: </span>
                      {nextMilestone ? (
                        <span className="text-xs font-semibold text-amber-900">
                          Week {nextMilestone.week} (Due {nextMilestone.dueDate})
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-800">
                          All check-ins completed!
                        </span>
                      )}
                    </div>
                  </div>

                  {dueInfo && (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto ${
                        dueInfo.status === 'Due now'
                          ? 'bg-amber-400 text-stone-900 animate-pulse'
                          : dueInfo.status === 'Overdue'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-white text-stone-700 border border-amber-300'
                      }`}
                    >
                      {dueInfo.label}
                    </span>
                  )}
                </div>

                {/* Milestone cards: Week 2, 6, 12 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {([2, 6, 12] as const).map((w) => {
                    const isCompleted = completedWeeks.includes(w);
                    const completedEntry = plan.completedCheckIns?.find((c) => c.week === w);
                    const dueDate = w === 2 ? plan.dueDates.week2 : w === 6 ? plan.dueDates.week6 : plan.dueDates.week12;
                    const due = computeDueStatus(dueDate);

                    return (
                      <div
                        key={w}
                        className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${
                          isCompleted
                            ? 'bg-emerald-50/50 border-emerald-200'
                            : 'bg-stone-50 border-stone-200'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-serif font-bold text-sm text-stone-900">
                              Week {w} Check-in
                            </span>
                            {isCompleted ? (
                              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-800">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Done</span>
                              </span>
                            ) : (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  due.status === 'Due now'
                                    ? 'bg-amber-200 text-amber-950 font-bold'
                                    : due.status === 'Overdue'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-stone-200 text-stone-700'
                                }`}
                              >
                                {due.label}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-500">
                            Target Date: {dueDate}
                          </p>
                          {isCompleted && completedEntry && (
                            <p className="text-[11px] text-emerald-900 font-medium">
                              Recorded on {completedEntry.date}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (isCompleted && completedEntry) {
                              setCurrentEvaluation({
                                plan,
                                week: w,
                                evaluation: completedEntry.evaluation,
                              });
                            } else {
                              startCheckIn(plan, w);
                            }
                          }}
                          className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                            isCompleted
                              ? 'bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-stone-900 hover:bg-stone-800 text-white'
                          }`}
                        >
                          <span>{isCompleted ? 'View Check-in Advice' : `Check In (Week ${w})`}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Products in this plan */}
                {plan.productNames.length > 0 && (
                  <div className="pt-2 text-xs text-stone-500">
                    <span className="font-semibold text-stone-700">Recommended products in routine: </span>
                    {plan.productNames.join(' · ')}
                  </div>
                )}

                {/* My Timeline (on-device photos) */}
                <TimelineView
                  planId={plan.id}
                  photos={photosByPlan[plan.id] || []}
                  onDeletePhoto={(photoId) => handleDeletePhoto(plan.id, photoId)}
                  onDeleteAllPhotos={() => handleDeleteAllPhotos(plan.id)}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Check-in Form Modal */}
      {activePlanForCheckIn && activeWeekForCheckIn && !currentEvaluation && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-xl border border-stone-200 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-stone-100 pb-4">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-amber-800">
                  Week {activeWeekForCheckIn} Check-in
                </span>
                <h2 className="font-serif text-2xl font-bold text-stone-900 mt-0.5">
                  Answer 6 Quick Questions
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  Evaluated using plain clinical safety rules. No AI.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActivePlanForCheckIn(null);
                  setActiveWeekForCheckIn(null);
                }}
                className="text-stone-400 hover:text-stone-600 text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitCheckIn} className="space-y-5">
              {/* (a) Overall */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-900">
                  (a) Overall, compared with the start:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['better', 'the same', 'worse'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setOverall(opt)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border capitalize transition-colors cursor-pointer ${
                        overall === opt
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* (b) Marks */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-900">
                  (b) Marks (post-acne red or brown spots):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['lighter', 'the same', 'darker', 'I have none'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setMarks(opt)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border capitalize transition-colors cursor-pointer ${
                        marks === opt
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* (c) Breakouts */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-900">
                  (c) Breakouts (pimples, whiteheads, bumps):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['fewer', 'the same', 'more', 'I have no breakouts'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setBreakouts(opt)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border capitalize transition-colors cursor-pointer ${
                        breakouts === opt
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* (d) Irritation */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-900">
                  (d) Since starting, any stinging, burning, swelling or rash?
                </label>
                <div className="space-y-1.5">
                  {(
                    [
                      { id: 'no', label: 'No irritation' },
                      { id: 'mild stinging', label: 'Mild stinging' },
                      { id: 'burning, swelling or rash', label: 'Burning, swelling or rash' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setIrritation(opt.id)}
                      className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-semibold border text-left transition-colors flex items-center justify-between cursor-pointer ${
                        irritation === opt.id
                          ? opt.id === 'burning, swelling or rash'
                            ? 'bg-rose-900 text-white border-rose-900'
                            : 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {irritation === opt.id && <span>✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* (e) Sunscreen */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-900">
                  (e) Did you wear sunscreen:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['most days', 'some days', 'rarely'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setSunscreen(opt)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border capitalize transition-colors cursor-pointer ${
                        sunscreen === opt
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* (f) Added new active */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-900">
                  (f) Did you add a new active product on your own?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['no', 'yes'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAddedNewActive(opt)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border uppercase transition-colors cursor-pointer ${
                        addedNewActive === opt
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setActivePlanForCheckIn(null);
                    setActiveWeekForCheckIn(null);
                  }}
                  className="px-4 py-2.5 text-xs text-stone-600 hover:text-stone-900 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isFormComplete}
                  className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Get my check-in result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Evaluation Results Modal */}
      {currentEvaluation && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-xl border border-stone-200 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            {/* If severe burning/rash: Show same dedicated dermatologist screen as referral, and NO further advice! */}
            {currentEvaluation.evaluation.needsDoctor &&
            currentEvaluation.evaluation.guidelines.length === 0 ? (
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-rose-50 border-2 border-rose-300 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                      <AlertCircle className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
                        Urgent Medical Assessment Recommended
                      </span>
                      <h2 className="font-serif text-2xl font-bold text-rose-950">
                        Stop the new products and see a doctor
                      </h2>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-rose-900 leading-relaxed font-medium">
                    You reported burning, swelling or a rash. Over-the-counter advice is halted immediately to protect your skin barrier.
                  </p>

                  <div className="space-y-2">
                    {currentEvaluation.evaluation.doctorReasons.map((r, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-2xl bg-white border border-rose-200 text-xs text-rose-900 flex items-start gap-3 shadow-2xs"
                      >
                        <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <div className="leading-relaxed">{r}</div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-2xl bg-white/80 border border-rose-200 text-xs text-stone-700 space-y-2">
                    <h4 className="font-bold text-stone-900">What to do right now:</h4>
                    <ul className="space-y-1.5 list-disc pl-4 text-stone-600">
                      <li>Rinse skin gently with cool water to remove residual product.</li>
                      <li>Do not apply any actives, scrubs, perfumes, or astringents.</li>
                      <li>Consult a certified dermatologist or urgent clinic if swelling, blistering, or spreading occurs.</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-stone-500">
                    These are general guidelines, not medical advice.
                  </span>
                  <button
                    onClick={() => {
                      setCurrentEvaluation(null);
                      setActivePlanForCheckIn(null);
                      setActiveWeekForCheckIn(null);
                    }}
                    className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Close & Return to Plans
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <span className="text-xs uppercase tracking-wider font-bold text-stone-500">
                    Week {currentEvaluation.week} Progress Evaluation
                  </span>
                  <h2 className="font-serif text-2xl font-bold text-stone-900 mt-0.5">
                    Your Tailored Advice
                  </h2>
                </div>

                {/* Referral recommendations first if applicable */}
                {currentEvaluation.evaluation.needsDoctor && (
                  <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
                    <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                      <span>Dermatologist Consultation Recommended</span>
                    </div>
                    <ul className="space-y-1.5 pl-4 list-disc text-xs text-rose-900">
                      {currentEvaluation.evaluation.doctorReasons.map((r, i) => (
                        <li key={i} className="leading-relaxed font-medium">
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Guidelines */}
                {currentEvaluation.evaluation.guidelines.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                      Next Step Guidelines
                    </h4>
                    <div className="space-y-2">
                      {currentEvaluation.evaluation.guidelines.map((g, i) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-800 flex items-start gap-2.5"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{g}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-2xl bg-stone-100 text-[11px] text-stone-600">
                  These are general guidelines, not medical advice.
                </div>

                <div className="pt-4 border-t border-stone-100 flex justify-end">
                  <button
                    onClick={() => {
                      setCurrentEvaluation(null);
                      setActivePlanForCheckIn(null);
                      setActiveWeekForCheckIn(null);
                    }}
                    className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Done & Saved
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Weekend Check Modal */}
      {activeWeekendCheckPlan && (
        <WeekendCheckModal
          plan={activeWeekendCheckPlan}
          isUnder18={
            Boolean(
              activeWeekendCheckPlan.isUnder18 ||
              activeWeekendCheckPlan.ageRange === 'under 18' ||
              userAnswers?.ageRange === 'under 18'
            )
          }
          existingRecords={weekendChecks.filter((r) => r.planId === activeWeekendCheckPlan.id)}
          onClose={() => setActiveWeekendCheckPlan(null)}
          onSaveRecord={handleSaveWeekendCheck}
          onPhotoSaved={() => loadPhotosForPlan(activeWeekendCheckPlan.id)}
        />
      )}
    </div>
  );
};
