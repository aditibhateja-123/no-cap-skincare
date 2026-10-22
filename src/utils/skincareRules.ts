import {
  UserQuizAnswers,
  PhotoAnalysisResult,
  Role,
  CatalogProduct,
  RankedProduct,
  RoutineSchedule,
  CheckInPlan,
  CheckInAnswers,
  CheckInEvaluation,
  ShelfCheckboxKey,
  ShelfState,
  ShelfEvaluation,
  ShelfRoutine,
  WeekendCheckAnswers,
  WeekendCheckRecord,
} from '../types';
import catalogData from '../data/catalog.json';

const catalog = catalogData as CatalogProduct[];

export interface ReferralCheckResult {
  needsReferral: boolean;
  reasons: string[];
}

export function checkReferral(
  answers: UserQuizAnswers,
  photoResult: PhotoAnalysisResult | null
): ReferralCheckResult {
  const reasons: string[] = [];

  if (answers.breakoutLevel === 'deep and painful') {
    reasons.push(
      'Deep and painful breakouts can be cystic, often scar, and usually need prescription oral or topical medicine from a doctor rather than over-the-counter skincare.'
    );
  }

  if (answers.healthSituations.includes('told by a doctor I have melasma')) {
    reasons.push(
      'Melasma is a chronic pigment condition easily provoked by heat, sun and improper actives. It requires tailored medical oversight to avoid worsening or rebound dark patches.'
    );
  }

  if (photoResult && photoResult.needs_clinician) {
    reasons.push(
      photoResult.clinician_reason ||
        'The photo scan spotted severe swelling, bleeding lesions, or marked irritation that needs in-person medical evaluation.'
    );
  }

  if (
    photoResult &&
    photoResult.findings.some(
      (f) => f.type === 'active_pimples' && f.severity === 'marked'
    )
  ) {
    reasons.push(
      'Marked active inflammatory pimples were identified on your photo, which need a clinical doctor assessment to control safely.'
    );
  }

  return {
    needsReferral: reasons.length > 0,
    reasons,
  };
}

export function determineActiveStrategy(
  answers: UserQuizAnswers,
  effectiveConcerns: string[]
): {
  basicsOnly: boolean;
  basicsReason?: string;
  activeChosen: string | null;
  secondActive: string | null;
  firstActiveName: string | null;
  secondActiveName: string | null;
  useSalicylicCleanser: boolean;
} {
  // Check BASICS ONLY condition
  if (answers.ageRange === 'under 18') {
    return {
      basicsOnly: true,
      basicsReason:
        'You are under 18. Teenage skin is still developing and active treatment serums are not recommended without a doctor. Focus on gentle basics only: cleanser, moisturizer, and daily sunscreen.',
      activeChosen: null,
      secondActive: null,
      firstActiveName: null,
      secondActiveName: null,
      useSalicylicCleanser: false,
    };
  }

  if (answers.healthSituations.includes('pregnant or breastfeeding')) {
    return {
      basicsOnly: true,
      basicsReason:
        'You indicated you are pregnant or breastfeeding. Many active ingredients are not suitable or lack established safety data during pregnancy. Stick to gentle basics (cleanser, moisturizer, sunscreen) and ask your doctor before adding any active.',
      activeChosen: null,
      secondActive: null,
      firstActiveName: null,
      secondActiveName: null,
      useSalicylicCleanser: false,
    };
  }

  if (answers.healthSituations.includes('on a prescribed skin treatment')) {
    return {
      basicsOnly: true,
      basicsReason:
        'You are on a doctor-prescribed skin treatment. Adding separate OTC active treatments risks severe barrier irritation or conflicting with your prescription. Use gentle basics only.',
      activeChosen: null,
      secondActive: null,
      firstActiveName: null,
      secondActiveName: null,
      useSalicylicCleanser: false,
    };
  }

  // Active ingredient rules:
  // "Only one active at a time. Start with azelaic acid for marks or acne (niacinamide if skin reacts often;
  // salicylic acid cleanser only if the concern is clogged pores). Allow at most one more, only after week 6
  // if skin is calm (alpha arbutin for brown marks, niacinamide for red marks, salicylic acid cleanser for clogged pores)."

  const hasMarksOrAcne =
    effectiveConcerns.includes('acne') ||
    effectiveConcerns.includes('red marks') ||
    effectiveConcerns.includes('brown marks');

  const onlyCloggedPores =
    effectiveConcerns.includes('clogged pores') && !hasMarksOrAcne;

  let activeChosen: string | null = null;
  let firstActiveName: string | null = null;
  let secondActive: string | null = null;
  let secondActiveName: string | null = null;
  let useSalicylicCleanser = false;

  if (onlyCloggedPores) {
    useSalicylicCleanser = true;
    firstActiveName = 'Salicylic Acid Cleanser (2%)';
  } else if (hasMarksOrAcne) {
    if (answers.sensitivity === 'often') {
      activeChosen = 'niacinamide';
      firstActiveName = 'Niacinamide (5%)';
    } else {
      activeChosen = 'azelaic';
      firstActiveName = 'Azelaic Acid (10%)';
    }

    // Determine potential second active for week 6
    if (effectiveConcerns.includes('brown marks')) {
      secondActive = 'arbutin';
      secondActiveName = 'Alpha Arbutin (2%)';
    } else if (effectiveConcerns.includes('red marks')) {
      if (activeChosen !== 'niacinamide') {
        secondActive = 'niacinamide';
        secondActiveName = 'Niacinamide (5%)';
      }
    } else if (effectiveConcerns.includes('clogged pores')) {
      secondActive = 'sa';
      secondActiveName = 'Salicylic Acid Cleanser (2%)';
    }
  }

  return {
    basicsOnly: false,
    activeChosen,
    secondActive,
    firstActiveName,
    secondActiveName,
    useSalicylicCleanser,
  };
}

export function rankProducts(
  role: Role,
  answers: UserQuizAnswers,
  activeChosen: string | null,
  useSalicylicCleanser: boolean
): RankedProduct[] {
  // Budget caps: under ₹300 = 300, ₹300 to 600 = 600, over ₹600 = 1000
  const budgetCap =
    answers.budget === 'under ₹300'
      ? 300
      : answers.budget === '₹300 to 600'
      ? 600
      : 1000;

  // Filter eligible
  const eligible = catalog.filter((product) => {
    if (product.role !== role) return false;
    if (product.rating < 4.0) return false;
    if (product.ratingCount < 500) return false;

    if (role === 'sunscreen' && (product.spf === null || product.spf < 30)) {
      return false;
    }

    // For cleanser, moisturizer, sunscreen: activeKey must be null unless salicylic cleanser is chosen
    if (role === 'cleanser') {
      if (useSalicylicCleanser) {
        if (product.activeKey !== 'sa') return false;
      } else {
        if (product.activeKey !== null) return false;
      }
    } else if (role === 'moisturizer' || role === 'sunscreen') {
      if (product.activeKey !== null) return false;
    } else if (role === 'treatment') {
      if (!activeChosen || product.activeKey !== activeChosen) return false;
    }

    // Exclude high_strength when user's skin stings or reddens sometimes or often
    if (
      (answers.sensitivity === 'sometimes' || answers.sensitivity === 'often') &&
      product.flags.includes('high_strength')
    ) {
      return false;
    }

    return true;
  });

  // Score each product
  const scored = eligible.map((product) => {
    let score = 0;
    const matchedOn: string[] = [];

    const isOilyCombo =
      answers.middayFeel === 'oily' ||
      answers.middayFeel === 'combination' ||
      answers.middayFeel === 'oily but tight';

    if (isOilyCombo && product.tags.oily) {
      score += 2;
      matchedOn.push('labelled oil-free, gel or for oily skin');
    }

    if (isOilyCombo && product.tags.dry && !product.tags.oily) {
      score -= 1.5;
    }

    if (answers.middayFeel === 'dry' && product.tags.dry) {
      score += 2;
      matchedOn.push('labelled for dry skin');
    }

    if (answers.middayFeel === 'dry' && product.tags.oily && !product.tags.dry) {
      score -= 1.5;
    }

    if (answers.sensitivity !== 'never' && product.tags.sensitive) {
      score += 1.5;
      matchedOn.push('labelled suitable for sensitive skin');
    }

    if (answers.concerns.includes('acne') && product.tags.acne) {
      score += 1;
      matchedOn.push('targeted for acne-prone skin');
    }

    if (role === 'sunscreen') {
      const isDeeperTone =
        answers.skinTone === 'wheatish' ||
        answers.skinTone === 'medium brown' ||
        answers.skinTone === 'deep brown';

      if (product.tags.noWhiteCast) {
        if (isDeeperTone) {
          score += 2;
          matchedOn.push('labelled no white cast (matters more on deeper skin tones)');
        } else {
          score += 1;
          matchedOn.push('labelled no white cast');
        }
      }

      if (product.spf && product.spf >= 50) {
        score += 0.5;
        matchedOn.push(`SPF ${product.spf}`);
      }
    }

    score += (product.rating - 4) * 2;

    if (product.ratingCount >= 10000) {
      score += 1;
    }

    // Always include rating reason
    matchedOn.push(
      `rated ${product.rating} from ${product.ratingCount.toLocaleString('en-IN')} ratings on ${product.seller}`
    );

    const flagLabels: string[] = [];
    if (product.flags.includes('may_contain_extra_active')) {
      flagLabels.push('Check the label: may contain a second active');
    }
    if (product.flags.includes('high_strength')) {
      flagLabels.push('Strong version');
    }

    return {
      ...product,
      score,
      matchedOn,
      isAboveBudget: product.price > budgetCap,
      flagLabels,
    };
  });

  // Separate within budget vs above budget
  const withinBudget = scored
    .filter((p) => p.price <= budgetCap)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.price - b.price; // tie broken by lower price
    });

  const aboveBudget = scored
    .filter((p) => p.price > budgetCap)
    .sort((a, b) => a.price - b.price); // cheapest others

  const result: RankedProduct[] = [...withinBudget];

  if (result.length < 3) {
    const needed = 3 - result.length;
    result.push(...aboveBudget.slice(0, needed));
  }

  return result.slice(0, 3);
}

export function buildRoutineSchedule(
  strategy: ReturnType<typeof determineActiveStrategy>,
  skinTone: string,
  hasBrownMarks: boolean
): RoutineSchedule {
  if (strategy.basicsOnly) {
    return {
      basicsOnly: true,
      basicsReason: strategy.basicsReason,
      firstActive: null,
      firstActiveName: null,
      secondActive: null,
      secondActiveName: null,
      schedule: {
        phase1: 'Weeks 1 to 2: Use only your gentle cleanser, moisturizer, and sunscreen daily.',
        phase2: 'Weeks 3 to 4: Continue basics only. Do not introduce active serums without asking your doctor.',
        phase3: 'Week 6 onwards: Maintain barrier stability with gentle non-stripping daily basics.',
      },
      timelineNote: 'Skin barrier recovery takes 4 to 6 weeks of steady gentle care.',
    };
  }

  const isDeeperTone =
    skinTone === 'wheatish' || skinTone === 'medium brown' || skinTone === 'deep brown';

  return {
    basicsOnly: false,
    firstActive: strategy.activeChosen,
    firstActiveName: strategy.firstActiveName,
    secondActive: strategy.secondActive,
    secondActiveName: strategy.secondActiveName,
    schedule: {
      phase1:
        'Weeks 1 to 2: Stick to gentle basics only (cleanser, moisturizer, sunscreen) and patch test your new active behind the ear or on inner arm for 24 hours.',
      phase2: strategy.firstActiveName
        ? `Week 3: Introduce your first active (${strategy.firstActiveName}) every other night after cleansing and before moisturizer.`
        : 'Week 3: Continue steady basic routine.',
      phase3: strategy.secondActiveName
        ? `Week 6 or later: Only if your skin is calm and showing no redness, consider introducing your optional second active (${strategy.secondActiveName}) on alternating evenings.`
        : 'Week 6 to 8: Continue single-active routine and assess progress.',
    },
    timelineNote:
      'Marks usually fade over months, so check with a photo at week 6 and week 12; acne routines need 6 to 8 weeks.',
    deeperToneNote:
      isDeeperTone && hasBrownMarks
        ? 'Brown marks can be slower to fade on deeper skin tones, and sun makes them darker, so a daily sunscreen matters most.'
        : undefined,
  };
}

export const FIXED_SKIP_THESE = [
  'Adding several active treatments at once',
  'Physical scrubs and harsh chemical peels on active acne',
  'Products that promise marks gone in days',
  'Heavily fragranced products if your skin reacts easily',
  'Heavy oils on oily or acne-prone skin',
];

export const FIXED_SEE_DERMATOLOGIST_WHEN = [
  'Deep, painful lumps beneath the skin (cystic lesions)',
  'Dark patches that spread or darken, especially symmetrical on both cheeks (melasma)',
  'Burning, swelling, hives or a blistering rash after starting a product',
  'No noticeable change after 12 weeks of steady, consistent use',
];

export function evaluateCheckIn(
  plan: CheckInPlan,
  week: 2 | 6 | 12,
  answers: CheckInAnswers
): CheckInEvaluation {
  // 1. If (d) is burning, swelling or rash: show "Stop the new products and see a doctor" using the same dermatologist screen as the referral, and no further advice.
  if (answers.irritation === 'burning, swelling or rash') {
    return {
      needsDoctor: true,
      doctorReasons: [
        'Stop the new products and see a doctor. Severe burning, swelling or rash can indicate contact allergy or severe barrier irritation that requires prompt clinical attention.',
      ],
      guidelines: [],
    };
  }

  const doctorReasons: string[] = [];
  const guidelines: string[] = [];

  // 2. If (d) is mild stinging: "Pause your active for a week, use only your cleanser, moisturizer and sunscreen, then restart every third night."
  if (answers.irritation === 'mild stinging') {
    guidelines.push(
      'Pause your active for a week, use only your cleanser, moisturizer and sunscreen, then restart every third night.'
    );
  }

  // 3. If overall is worse or breakouts are more, and the week is 6 or 12: recommend seeing a dermatologist. At week 2: "Give it more time, and pause the active if it stings."
  if (answers.overall === 'worse' || answers.breakouts === 'more') {
    if (week === 6 || week === 12) {
      doctorReasons.push(
        `Worsening breakouts or overall skin condition by week ${week}. We recommend seeing a dermatologist for a medical evaluation.`
      );
    } else if (week === 2) {
      guidelines.push('Give it more time, and pause the active if it stings.');
    }
  }

  // Darker marks rule: if marks are "darker" at week 6 or 12, recommend seeing a dermatologist
  // and add "Pause any new active and be strict with daily sunscreen."
  // At week 2, "darker" shows "Give it more time, keep to the basics, and wear sunscreen daily."
  if (answers.marks === 'darker') {
    if (week === 6 || week === 12) {
      doctorReasons.push('Marks have become darker. We recommend seeing a dermatologist.');
      guidelines.push('Pause any new active and be strict with daily sunscreen.');
    } else if (week === 2) {
      guidelines.push('Give it more time, keep to the basics, and wear sunscreen daily.');
    }
  }

  // 4. Week 2 with no irritation (and not darker marks): "You can now start your first active (name) every other night."
  if (week === 2 && answers.irritation === 'no' && answers.marks !== 'darker') {
    const activeName = plan.firstActiveName || 'your active treatment';
    if (!plan.basicsOnly && plan.firstActiveName) {
      guidelines.push(`You can now start your first active (${activeName}) every other night.`);
    } else {
      guidelines.push('You can continue steady daily use of your gentle basics.');
    }
  }

  // 5. Week 6, calm skin:
  // If the person answered marks "I have none", do not suggest a second active. Show "Keep your routine as it is."
  // Keep the current behaviour for lighter or the same marks: if the plan has a second active, "You may add (name) now. Add it alone." Otherwise "Keep your routine as it is."
  const isCalmSkin = answers.irritation === 'no';
  if (week === 6 && isCalmSkin) {
    if (answers.marks === 'I have none') {
      guidelines.push('Keep your routine as it is.');
    } else if (answers.marks === 'lighter' || answers.marks === 'the same') {
      if (plan.secondActiveName) {
        guidelines.push(`You may add ${plan.secondActiveName} now. Add it alone.`);
      } else {
        guidelines.push('Keep your routine as it is.');
      }
    }
  }

  // 6. Week 12: work out which items apply to the person.
  // Marks apply unless they answered "I have none".
  // Breakouts apply unless they answered "I have no breakouts".
  // Overall always applies.
  // Recommend a dermatologist ("No noticeable change after 12 weeks of steady, consistent use")
  // only if at least one item applies AND none of the applicable items improved (marks lighter, breakouts fewer, overall better).
  // If neither marks nor breakouts apply and overall is "the same", do not refer: show "Your skin looks stable. Keep your routine as it is."
  if (week === 12) {
    const marksApply = answers.marks !== 'I have none';
    const breakoutsApply = answers.breakouts !== 'I have no breakouts';

    const marksImproved = marksApply && answers.marks === 'lighter';
    const breakoutsImproved = breakoutsApply && answers.breakouts === 'fewer';
    const overallImproved = answers.overall === 'better';

    const anyImproved = marksImproved || breakoutsImproved || overallImproved;
    const atLeastOneSpecificItemApplies = marksApply || breakoutsApply;

    if (atLeastOneSpecificItemApplies) {
      if (!anyImproved) {
        doctorReasons.push(
          'No noticeable change after 12 weeks of steady, consistent use'
        );
      }
    } else {
      // Neither marks nor breakouts apply
      if (answers.overall === 'the same') {
        guidelines.push('Your skin looks stable. Keep your routine as it is.');
      }
    }
  }

  // 7. If (e) is rarely: "Marks will not fade well without daily sunscreen. Make it a daily habit." If (f) is yes: "Adding actives on your own makes irritation and longer-lasting marks more likely. Add one at a time."
  if (answers.sunscreen === 'rarely') {
    guidelines.push('Marks will not fade well without daily sunscreen. Make it a daily habit.');
  }

  if (answers.addedNewActive === 'yes') {
    guidelines.push(
      'Adding actives on your own makes irritation and longer-lasting marks more likely. Add one at a time.'
    );
  }

  return {
    needsDoctor: doctorReasons.length > 0,
    doctorReasons,
    guidelines,
  };
}

export function formatLocalDateToYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDaysLocal(base: Date, days: number): Date {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
}

export function parseLocalDate(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const SHELF_ACTIVE_DISPLAY_NAMES: Record<string, string> = {
  retinoid: 'Retinol or retinoid',
  aha: 'AHA (glycolic, lactic, mandelic)',
  bha: 'BHA (salicylic acid)',
  bpo: 'Benzoyl peroxide',
  vit_c: 'Vitamin C',
  azelaic: 'Azelaic acid',
  niacinamide: 'Niacinamide',
  arbutin: 'Alpha arbutin',
};

export function evaluateShelf(
  items:
    | ShelfState
    | { products?: CatalogProduct[]; productIds?: string[]; checkboxKeys: ShelfCheckboxKey[] }
): ShelfEvaluation {
  const checkboxKeys: ShelfCheckboxKey[] = items.checkboxKeys || [];

  // Rule A, stop and see a doctor: if she ticks "Prescription cream from a doctor"
  if (checkboxKeys.includes('rx_cream')) {
    return {
      isDoctorOnly: true,
      rules: ['Ask the doctor who prescribed it before changing or adding anything'],
      routine: null,
    };
  }

  // Resolve products
  let products: CatalogProduct[] = [];
  if ('products' in items && items.products) {
    products = items.products;
  } else if ('productIds' in items && items.productIds) {
    products = items.productIds
      .map((id) => catalog.find((p) => p.id === id))
      .filter((p): p is CatalogProduct => Boolean(p));
  }

  const totalItems = products.length + checkboxKeys.length;

  // Track active occurrences
  const activeOccurrences: Record<string, number> = {};

  products.forEach((p) => {
    if (p.activeKey) {
      const canonical = p.activeKey === 'sa' ? 'bha' : p.activeKey;
      activeOccurrences[canonical] = (activeOccurrences[canonical] || 0) + 1;
    }
  });

  const activeCheckboxList: ShelfCheckboxKey[] = [
    'retinoid',
    'aha',
    'bha',
    'bpo',
    'vit_c',
    'azelaic',
    'niacinamide',
    'arbutin',
  ];

  checkboxKeys.forEach((key) => {
    if (activeCheckboxList.includes(key)) {
      activeOccurrences[key] = (activeOccurrences[key] || 0) + 1;
    }
  });

  const distinctActives = new Set<string>(Object.keys(activeOccurrences));

  let cleanserCount = products.filter((p) => p.role === 'cleanser').length;
  if (checkboxKeys.includes('extra_cleanser')) cleanserCount += 1;

  let sunscreenCount = products.filter((p) => p.role === 'sunscreen').length;
  if (checkboxKeys.includes('extra_sunscreen')) sunscreenCount += 1;

  const moisturizerCount = products.filter((p) => p.role === 'moisturizer').length;

  const hasAHA = distinctActives.has('aha');
  const hasBHA = distinctActives.has('bha');
  const hasRetinoid = distinctActives.has('retinoid');
  const hasBPO = distinctActives.has('bpo');
  const hasVitC = distinctActives.has('vit_c');
  const hasScrub = checkboxKeys.includes('scrub');

  const rules: string[] = [];

  // Rule B, too many actives: if she has three or more different actives in total
  const isRuleBTriggered = distinctActives.size >= 3;
  if (isRuleBTriggered) {
    rules.push(
      'That is a lot of actives for skin to handle. Keep one active going at a time and pause the rest until your skin is calm.'
    );
  }

  // Rule C, exfoliating acids together: AHA and BHA, or either of them together with a retinoid
  const isRuleCTriggered =
    (hasAHA && hasBHA) || (hasAHA && hasRetinoid) || (hasBHA && hasRetinoid);
  if (isRuleCTriggered) {
    rules.push(
      'Do not use these on the same night. Strong exfoliation together raises the chance of stinging, peeling and darker marks. Pick one for now.'
    );
  }

  // Rule D, retinoid with other strong actives: retinoid with benzoyl peroxide or vitamin C
  const isRuleDTriggered = hasRetinoid && (hasBPO || hasVitC);
  if (isRuleDTriggered) {
    rules.push(
      'Use these on different nights, or ask a dermatologist how to combine them. Together they often irritate.'
    );
  }

  // Rule E, vitamin C with an exfoliating acid
  const isRuleETriggered = hasVitC && (hasAHA || hasBHA);
  if (isRuleETriggered) {
    rules.push(
      'Use these at different times of day, for example vitamin C in the morning and the acid at night, or on different days.'
    );
  }

  // Rule F, scrub with any active: if "Physical scrub" is ticked and she has any active
  const isRuleFTriggered = hasScrub && distinctActives.size > 0;
  if (isRuleFTriggered) {
    rules.push('Scrubs plus actives can damage the skin barrier. Pause the scrub.');
  }

  // Rule G, doubled up: two cleansers, or two sunscreens, or two products of the same activeKey
  const hasDoubledActive = Object.values(activeOccurrences).some((count) => count >= 2);
  const isRuleGTriggered = cleanserCount >= 2 || sunscreenCount >= 2 || hasDoubledActive;
  if (isRuleGTriggered) {
    rules.push('You have two of the same kind. You only need one at a time.');
  }

  // Rule H, no sunscreen: if she has any active (or acid or retinoid or benzoyl peroxide) and no sunscreen on the shelf
  const isRuleHTriggered = distinctActives.size > 0 && sunscreenCount === 0;
  if (isRuleHTriggered) {
    rules.push(
      'Actives make skin more sun sensitive and marks darker when you skip sunscreen. A daily sunscreen matters more than any serum.'
    );
  }

  // Rule I: Has active and no moisturizer
  const isRuleITriggered = distinctActives.size > 0 && moisturizerCount === 0;
  if (isRuleITriggered) {
    rules.push('A plain moisturizer helps the skin tolerate actives.');
  }

  // Rule J: If none of A-I apply and she has >= 1 item
  if (rules.length === 0 && totalItems >= 1) {
    rules.push('Nothing on your shelf clashes. Keep to one new thing at a time.');
  }

  // Build Routine Arrangement Table
  if (totalItems === 0) {
    return {
      isDoctorOnly: false,
      rules: [],
      routine: null,
    };
  }

  const pausedItems: string[] = [];
  if (isRuleFTriggered) {
    pausedItems.push('Physical scrub (pause while using active treatments)');
  }

  const activeKeysArray = Array.from(distinctActives);
  const activeNameMap = (key: string): string => {
    const product = products.find(
      (p) => p.activeKey === key || (key === 'bha' && p.activeKey === 'sa')
    );
    const label = SHELF_ACTIVE_DISPLAY_NAMES[key] || key;
    return product ? `${label} (${product.name})` : label;
  };

  const unpausedActives: string[] = [];

  if (isRuleBTriggered) {
    if (activeKeysArray.length > 0) {
      unpausedActives.push(activeKeysArray[0]);
      for (let i = 1; i < activeKeysArray.length; i++) {
        pausedItems.push(activeNameMap(activeKeysArray[i]));
      }
    }
  } else if (isRuleCTriggered) {
    const acidOrRetinoid = activeKeysArray.filter((k) => ['aha', 'bha', 'retinoid'].includes(k));
    const kept = acidOrRetinoid[0];
    const clashingPaused = acidOrRetinoid.slice(1);
    clashingPaused.forEach((k) => pausedItems.push(activeNameMap(k)));

    activeKeysArray.forEach((k) => {
      if (!clashingPaused.includes(k)) {
        unpausedActives.push(k);
      }
    });
  } else {
    unpausedActives.push(...activeKeysArray);
  }

  const ownedCleanser = products.find((p) => p.role === 'cleanser');
  const cleanserLabel = ownedCleanser ? ownedCleanser.name : (cleanserCount > 0 ? 'Your cleanser' : undefined);

  const ownedMoisturizer = products.find((p) => p.role === 'moisturizer');
  const moisturizerLabel = ownedMoisturizer ? ownedMoisturizer.name : (moisturizerCount > 0 ? 'Your moisturizer' : undefined);

  const ownedSunscreen = products.find((p) => p.role === 'sunscreen');
  const sunscreenLabel = ownedSunscreen ? ownedSunscreen.name : (sunscreenCount > 0 ? 'Your sunscreen' : undefined);

  // Morning routine
  const morning: string[] = [];
  if (cleanserLabel) morning.push(`Cleanser: ${cleanserLabel}`);
  if (unpausedActives.includes('vit_c')) {
    morning.push(`Active: ${activeNameMap('vit_c')} (morning use)`);
  }
  if (moisturizerLabel) morning.push(`Moisturizer: ${moisturizerLabel}`);
  if (sunscreenLabel) morning.push(`Sunscreen: ${sunscreenLabel}`);

  // Night routine
  let nightActiveKeys = unpausedActives.filter((k) => k !== 'vit_c');
  if (nightActiveKeys.length === 0 && unpausedActives.includes('vit_c') && !isRuleETriggered) {
    nightActiveKeys = ['vit_c'];
  }

  const treatmentSchedule: { dayPattern: string; activeName: string }[] = [];
  if (nightActiveKeys.length === 1) {
    treatmentSchedule.push({
      dayPattern: 'Nights 1, 3, 5 (every other night)',
      activeName: activeNameMap(nightActiveKeys[0]),
    });
    treatmentSchedule.push({
      dayPattern: 'Alternate nights',
      activeName: 'Basics only (rest night)',
    });
  } else if (nightActiveKeys.length >= 2) {
    treatmentSchedule.push({
      dayPattern: 'Nights 1, 3, 5',
      activeName: activeNameMap(nightActiveKeys[0]),
    });
    treatmentSchedule.push({
      dayPattern: 'Nights 2, 4, 6',
      activeName: activeNameMap(nightActiveKeys[1]),
    });
    treatmentSchedule.push({
      dayPattern: 'Night 7',
      activeName: 'Basics only (rest night)',
    });
  }

  const night = {
    cleanser: cleanserLabel ? `Cleanser: ${cleanserLabel}` : undefined,
    treatmentSchedule,
    moisturizer: moisturizerLabel ? `Moisturizer: ${moisturizerLabel}` : undefined,
  };

  return {
    isDoctorOnly: false,
    rules,
    routine: {
      morning,
      night,
      pausedItems,
    },
  };
}

export function evaluateWeekend(answers: WeekendCheckAnswers): string[] {
  const notes: string[] = [];

  // If (a) is "More irritated":
  // "Pause your active for a few days and stick to cleanser, moisturizer and sunscreen. If it burns, swells or rashes, stop and see a doctor."
  if (answers.skinFeel === 'More irritated') {
    notes.push(
      'Pause your active for a few days and stick to cleanser, moisturizer and sunscreen. If it burns, swells or rashes, stop and see a doctor.'
    );
  }

  // If (b) is "Many":
  // "Many new breakouts can need a dermatologist. If this lasts 2 more weeks, book one."
  if (answers.breakouts === 'Many') {
    notes.push(
      'Many new breakouts can need a dermatologist. If this lasts 2 more weeks, book one.'
    );
  }

  // If (c) is "Rarely":
  // "Marks will not fade well without daily sunscreen. Try keeping it next to your toothbrush."
  if (answers.sunscreen === 'Rarely') {
    notes.push(
      'Marks will not fade well without daily sunscreen. Try keeping it next to your toothbrush.'
    );
  }

  // If none of the above applies: "Nice, you're on track. Keep going." Do not praise or promise results.
  if (notes.length === 0) {
    notes.push("Nice, you're on track. Keep going.");
  }

  // Always add "These are general guidelines, not medical advice."
  notes.push('These are general guidelines, not medical advice.');

  return notes;
}

export function getWeekendCheckStatus(
  lastCheckDate?: string,
  refDate?: Date
): { isReady: boolean; label: string; diffDays: number | null } {
  const now = refDate || new Date();
  const dayOfWeek = now.getDay(); // 0 is Sunday, 6 is Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  if (isWeekend) {
    return {
      isReady: true,
      label: 'Your Weekend check is ready',
      diffDays: null,
    };
  }

  if (lastCheckDate) {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const [y, m, d] = lastCheckDate.split('-').map(Number);
    const last = new Date(y, m - 1, d);
    const diffDays = Math.max(0, Math.round((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)));
    return {
      isReady: false,
      label: diffDays === 1 ? 'Last done 1 day ago' : `Last done ${diffDays} days ago`,
      diffDays,
    };
  }

  return {
    isReady: false,
    label: 'Not done yet',
    diffDays: null,
  };
}

export function calculateWeekendStreak(
  records: WeekendCheckRecord[],
  refDate?: Date
): number {
  if (!records || records.length === 0) return 0;

  const now = refDate || new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Helper to map date to Sunday of its week
  const getSundayMs = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const day = dt.getDay();
    const daysToSunday = day === 0 ? 0 : 7 - day;
    const sunday = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + daysToSunday);
    return sunday.getTime();
  };

  const currentSunday = (() => {
    const day = today.getDay();
    const daysToSunday = day === 0 ? 0 : 7 - day;
    const s = new Date(today.getFullYear(), today.getMonth(), today.getDate() + daysToSunday);
    return s.getTime();
  })();

  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const lastSunday = currentSunday - oneWeekMs;

  // Unique weeks with checks, sorted descending
  const uniqueWeekSundays = Array.from(
    new Set(records.map((r) => getSundayMs(r.date)))
  ).sort((a, b) => b - a);

  if (uniqueWeekSundays.length === 0) return 0;

  const latestWeek = uniqueWeekSundays[0];

  // If latest check is older than last week, streak is broken
  if (latestWeek < lastSunday) {
    return 0;
  }

  // Count consecutive weeks backwards
  let streak = 1;
  for (let i = 0; i < uniqueWeekSundays.length - 1; i++) {
    const current = uniqueWeekSundays[i];
    const next = uniqueWeekSundays[i + 1];
    // Check if exactly 1 week (allow +- 1 hour for daylight saving)
    const diff = Math.round((current - next) / (24 * 60 * 60 * 1000));
    if (diff === 7) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

import type { MiddayFeel as FinderFeel, SkinTone as FinderTone, Budget as FinderBudget } from '../types';

export type FinderPriority = 'noWhiteCast' | 'spf50' | 'gentle' | 'acne';

export const FINDER_PRIORITY_LABELS: Record<FinderPriority, string> = {
  noWhiteCast: 'No white cast',
  spf50: 'SPF 50 or higher',
  gentle: 'Gentle on sensitive skin',
  acne: 'For acne-prone skin',
};

export interface FinderAnswers {
  feel: FinderFeel;
  tone: FinderTone;
  budget: FinderBudget;
  priorities: FinderPriority[];
}

export interface FinderResult {
  product: CatalogProduct;
  score: number;
  matchedOn: string[];
  isAboveBudget: boolean;
  flagLabels: string[];
  // Priorities this product does not meet, as readable text.
  missing: string[];
}

export interface FinderOutput {
  results: FinderResult[];
  // True when no product meets every ticked priority.
  noExactMatch: boolean;
}

function finderMeets(product: CatalogProduct, priority: FinderPriority): boolean {
  switch (priority) {
    case 'noWhiteCast':
      return product.tags.noWhiteCast;
    case 'spf50':
      return product.spf !== null && product.spf >= 50;
    case 'gentle':
      return product.tags.sensitive && !product.flags.includes('high_strength');
    case 'acne':
      return product.tags.acne;
  }
}

export function findSunscreens(answers: FinderAnswers): FinderOutput {
  const budgetCap =
    answers.budget === 'under ₹300' ? 300 : answers.budget === '₹300 to 600' ? 600 : 1000;
  const gentle = answers.priorities.includes('gentle');
  const acne = answers.priorities.includes('acne');
  const isOilyCombo =
    answers.feel === 'oily' || answers.feel === 'combination' || answers.feel === 'oily but tight';
  const isDeeperTone =
    answers.tone === 'wheatish' || answers.tone === 'medium brown' || answers.tone === 'deep brown';

  const candidates = catalog.filter(
    (p) =>
      p.role === 'sunscreen' &&
      p.rating >= 4.0 &&
      p.ratingCount >= 500 &&
      p.spf !== null &&
      p.spf >= 30 &&
      p.activeKey === null &&
      !(gentle && p.flags.includes('high_strength'))
  );

  const scored: FinderResult[] = candidates.map((product) => {
    let score = 0;
    const matchedOn: string[] = [];

    if (isOilyCombo && product.tags.oily) {
      score += 2;
      matchedOn.push('labelled oil-free, gel or for oily skin');
    }
    if (isOilyCombo && product.tags.dry && !product.tags.oily) score -= 1.5;
    if (answers.feel === 'dry' && product.tags.dry) {
      score += 2;
      matchedOn.push('labelled for dry skin');
    }
    if (answers.feel === 'dry' && product.tags.oily && !product.tags.dry) score -= 1.5;
    if (gentle && product.tags.sensitive) {
      score += 1.5;
      matchedOn.push('labelled suitable for sensitive skin');
    }
    if (acne && product.tags.acne) {
      score += 1;
      matchedOn.push('targeted for acne-prone skin');
    }
    if (product.tags.noWhiteCast) {
      if (isDeeperTone) {
        score += 2;
        matchedOn.push('labelled no white cast (matters more on deeper skin tones)');
      } else {
        score += 1;
        matchedOn.push('labelled no white cast');
      }
    }
    if (product.spf !== null && product.spf >= 50) {
      score += 0.5;
      matchedOn.push(`SPF ${product.spf}`);
    }
    score += (product.rating - 4) * 2;
    if (product.ratingCount >= 10000) score += 1;
    matchedOn.push(
      `rated ${product.rating} from ${product.ratingCount.toLocaleString('en-IN')} ratings on ${product.seller}`
    );

    const flagLabels: string[] = [];
    if (product.flags.includes('may_contain_extra_active')) {
      flagLabels.push('Check the label: may contain a second active');
    }
    if (product.flags.includes('high_strength')) flagLabels.push('Strong version');

    const missing = answers.priorities
      .filter((pr) => !finderMeets(product, pr))
      .map((pr) => `Does not match: ${FINDER_PRIORITY_LABELS[pr]}`);

    return {
      product,
      score,
      matchedOn,
      isAboveBudget: product.price > budgetCap,
      flagLabels,
      missing,
    };
  });

  const byScoreThenPrice = (a: FinderResult, b: FinderResult) =>
    b.score !== a.score ? b.score - a.score : a.product.price - b.product.price;
  const byCheapest = (a: FinderResult, b: FinderResult) => a.product.price - b.product.price;

  const exact = scored.filter((r) => r.missing.length === 0);
  const near = scored.filter((r) => r.missing.length > 0);

  // Within budget first (best score first), then the cheapest above budget.
  const order = (list: FinderResult[]) => [
    ...list.filter((r) => !r.isAboveBudget).sort(byScoreThenPrice),
    ...list.filter((r) => r.isAboveBudget).sort(byCheapest),
  ];

  const nearOrdered = [...near].sort((a, b) => {
    if (a.isAboveBudget !== b.isAboveBudget) return a.isAboveBudget ? 1 : -1;
    if (a.missing.length !== b.missing.length) return a.missing.length - b.missing.length;
    return byScoreThenPrice(a, b);
  });

  const results = [...order(exact), ...nearOrdered].slice(0, 3);

  return { results, noExactMatch: answers.priorities.length > 0 && exact.length === 0 };
}
