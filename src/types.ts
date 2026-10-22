export type Role = 'moisturizer' | 'sunscreen' | 'cleanser' | 'treatment';

export type AgeRange = 'under 18' | '18 to 24' | '25 to 34' | '35 or older';

export type SkinTone = 'very fair' | 'fair' | 'wheatish' | 'medium brown' | 'deep brown';

export type Concern =
  | 'acne'
  | 'red marks'
  | 'brown marks'
  | 'clogged pores'
  | 'oil and shine'
  | 'tight or dehydrated skin';

export type MiddayFeel = 'oily' | 'combination' | 'oily but tight' | 'normal' | 'dry';

export type BreakoutLevel = 'none' | 'mild' | 'moderate' | 'deep and painful';

export type MarksDuration = 'none' | 'under 3 months' | '3 to 12 months' | 'over a year';

export type Sensitivity = 'never' | 'sometimes' | 'often';

export type HealthSituation =
  | 'pregnant or breastfeeding'
  | 'on a prescribed skin treatment'
  | 'told by a doctor I have melasma';

export type Budget = 'under ₹300' | '₹300 to 600' | 'over ₹600';

export interface UserQuizAnswers {
  lookingFor: Role[];
  ageRange: AgeRange;
  skinTone: SkinTone;
  concerns: Concern[];
  middayFeel: MiddayFeel;
  breakoutLevel: BreakoutLevel;
  marksDuration: MarksDuration;
  sensitivity: Sensitivity;
  healthSituations: HealthSituation[];
  budget: Budget;
}

export type FindingType =
  | 'active_pimples'
  | 'red_marks'
  | 'brown_marks'
  | 'closed_comedones_or_bumps'
  | 'oily_shine'
  | 'dryness_flaking'
  | 'dark_circles'
  | 'diffuse_redness'
  | 'other';

export type FindingSeverity = 'none' | 'mild' | 'moderate' | 'marked';

export type FaceZone =
  | 'forehead'
  | 'left_cheek'
  | 'right_cheek'
  | 'nose'
  | 'chin'
  | 'under_eye'
  | 'around_mouth';

export type QualityIssue =
  | 'too_dark'
  | 'too_bright'
  | 'blurry'
  | 'no_face'
  | 'multiple_faces'
  | 'heavy_makeup_or_filter'
  | 'face_partly_covered'
  | 'low_resolution';

export interface PhotoFinding {
  id: string;
  type: FindingType;
  severity: FindingSeverity;
  zones: FaceZone[];
  note: string;
  enabled?: boolean;
}

export interface PhotoAnalysisResult {
  image_ok: boolean;
  quality_issues: QualityIssue[];
  findings: PhotoFinding[];
  needs_clinician: boolean;
  clinician_reason: string;
  confidence: 'low' | 'medium' | 'high';
  summary: string;
}

export interface CatalogReviews {
  source: string;
  collectedAt: string;
  sample: {
    positive: number;
    negative: number;
  };
  praise: string[];
  complaints: string[];
  note: string;
}

export interface CatalogProduct {
  id: string;
  name: string;
  role: Role;
  activeKey: string | null;
  activePct: number | null;
  spf: number | null;
  flags: string[];
  tags: {
    oily: boolean;
    dry: boolean;
    sensitive: boolean;
    acne: boolean;
    noWhiteCast: boolean;
  };
  rating: number;
  ratingCount: number;
  price: number;
  mrp: number;
  seller: string;
  url: string;
  checkedAt: string;
  reviews: CatalogReviews | null;
  dermReview?: {
    reviewedBy: string;
    date: string;
  } | null;
}

export interface RankedProduct extends CatalogProduct {
  score: number;
  matchedOn: string[];
  isAboveBudget: boolean;
  flagLabels: string[];
}

export interface RoutineSchedule {
  basicsOnly: boolean;
  basicsReason?: string;
  firstActive: string | null;
  firstActiveName: string | null;
  secondActive: string | null;
  secondActiveName: string | null;
  schedule: {
    phase1: string;
    phase2: string;
    phase3: string;
  };
  timelineNote: string;
  deeperToneNote?: string;
}

export interface SavedConsultation {
  id: string;
  date: string;
  ageRange: AgeRange;
  skinTone: SkinTone;
  concerns: string[];
  productNames: string[];
}

export interface CheckInAnswers {
  overall: 'better' | 'the same' | 'worse';
  marks: 'lighter' | 'the same' | 'darker' | 'I have none';
  breakouts: 'fewer' | 'the same' | 'more' | 'I have no breakouts';
  irritation: 'no' | 'mild stinging' | 'burning, swelling or rash';
  sunscreen: 'most days' | 'some days' | 'rarely';
  addedNewActive: 'no' | 'yes';
}

export interface CheckInEvaluation {
  needsDoctor: boolean;
  doctorReasons: string[];
  guidelines: string[];
}

export interface CompletedCheckIn {
  week: 2 | 6 | 12;
  date: string;
  answers: CheckInAnswers;
  evaluation: CheckInEvaluation;
}

export interface CheckInPlan {
  id: string;
  startDate: string; // YYYY-MM-DD
  concerns: string[];
  productNames: string[];
  firstActiveName: string | null;
  secondActiveName: string | null;
  basicsOnly: boolean;
  dueDates: {
    week2: string; // YYYY-MM-DD
    week6: string; // YYYY-MM-DD
    week12: string; // YYYY-MM-DD
  };
  completedCheckIns?: CompletedCheckIn[];
  isUnder18?: boolean;
  ageRange?: AgeRange;
}

export interface WeekendCheckAnswers {
  skinFeel: 'Calmer' | 'Same' | 'More irritated';
  breakouts: 'None' | 'A few' | 'Many';
  sunscreen: 'Yes' | 'Some days' | 'Rarely';
}

export interface WeekendCheckRecord {
  id: string;
  planId: string;
  date: string; // YYYY-MM-DD
  answers: WeekendCheckAnswers;
  hasPhoto?: boolean;
  evaluationNotes?: string[];
}

export interface TimelinePhotoItem {
  id: string;
  planId: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  url: string;
}

export type ShelfCheckboxKey =
  | 'retinoid'
  | 'rx_cream'
  | 'aha'
  | 'bha'
  | 'bpo'
  | 'vit_c'
  | 'azelaic'
  | 'niacinamide'
  | 'arbutin'
  | 'scrub'
  | 'extra_cleanser'
  | 'extra_sunscreen';

export interface ShelfState {
  productIds: string[];
  checkboxKeys: ShelfCheckboxKey[];
}

export interface ShelfRoutine {
  morning: string[];
  night: {
    cleanser?: string;
    treatmentSchedule: { dayPattern: string; activeName: string }[];
    moisturizer?: string;
  };
  pausedItems: string[];
}

export interface ShelfEvaluation {
  isDoctorOnly: boolean;
  rules: string[];
  routine: ShelfRoutine | null;
}
