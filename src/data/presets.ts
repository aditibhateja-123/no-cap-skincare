import { UserQuizAnswers, PhotoFinding } from '../types';

export interface PresetSample {
  id: string;
  name: string;
  badge: string; // "Demo profile, not a real person"
  answers: UserQuizAnswers;
  description: string;
  imageSvg: string;
  mockFindings: PhotoFinding[];
}

const createPortraitSvg = (
  bgGradient: [string, string],
  skinColor: string,
  hairColor: string,
  hairStyle: 'waves' | 'curly' | 'sleek',
  markHighlights?: { x: number; y: number; r: number; color: string }[]
) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 480" width="400" height="480">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgGradient[0]}"/>
        <stop offset="100%" stop-color="${bgGradient[1]}"/>
      </linearGradient>
    </defs>
    <rect width="400" height="480" fill="url(#bg)" />
    <path d="M 120 480 L 120 380 Q 200 400 280 380 L 280 480 Z" fill="${skinColor}" />
    <path d="M 80 480 Q 200 420 320 480" fill="#2d2a26" opacity="0.8" />
    <path d="M 160 330 L 160 380 Q 200 395 240 380 L 240 330 Z" fill="${skinColor}" opacity="0.95" />
    
    ${
      hairStyle === 'waves'
        ? `<path d="M 100 220 Q 80 340 110 420 Q 140 440 150 360 Q 130 260 130 200" fill="${hairColor}" />
           <path d="M 300 220 Q 320 340 290 420 Q 260 440 250 360 Q 270 260 270 200" fill="${hairColor}" />`
        : hairStyle === 'curly'
        ? `<circle cx="110" cy="220" r="45" fill="${hairColor}" />
           <circle cx="290" cy="220" r="45" fill="${hairColor}" />
           <circle cx="100" cy="280" r="40" fill="${hairColor}" />
           <circle cx="300" cy="280" r="40" fill="${hairColor}" />`
        : `<path d="M 115 160 Q 95 320 120 380 Q 280 380 285 380 Q 305 320 285 160 Z" fill="${hairColor}" opacity="0.7"/>`
    }

    <ellipse cx="200" cy="250" rx="90" ry="115" fill="${skinColor}" />
    
    ${
      hairStyle === 'waves'
        ? `<path d="M 110 220 C 100 130, 200 110, 290 220 C 270 150, 130 150, 110 220 Z" fill="${hairColor}" />`
        : hairStyle === 'curly'
        ? `<path d="M 100 180 Q 130 100 200 110 Q 270 100 300 180 Q 200 140 100 180 Z" fill="${hairColor}" />`
        : `<path d="M 110 200 C 120 120, 280 120, 290 200 C 260 160, 140 160, 110 200 Z" fill="${hairColor}" />`
    }

    <path d="M 140 215 Q 165 208 185 216" stroke="#2c2420" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.85" />
    <path d="M 215 216 Q 235 208 260 215" stroke="#2c2420" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.85" />

    <ellipse cx="163" cy="235" rx="14" ry="8" fill="#ffffff" />
    <ellipse cx="237" cy="235" rx="14" ry="8" fill="#ffffff" />
    <circle cx="163" cy="235" r="6" fill="#3b2b20" />
    <circle cx="237" cy="235" r="6" fill="#3b2b20" />
    <path d="M 149 233 Q 163 227 177 233" stroke="#2c2420" stroke-width="1.8" fill="none" />
    <path d="M 223 233 Q 237 227 251 233" stroke="#2c2420" stroke-width="1.8" fill="none" />

    <path d="M 197 230 L 195 275 Q 190 282 200 282 Q 210 282 205 275 L 203 230" fill="none" stroke="#684a36" stroke-width="1.8" opacity="0.4" />
    <path d="M 175 315 Q 188 310 200 312 Q 212 310 225 315 Q 200 322 175 315 Z" fill="#b86968" opacity="0.8" />
    <path d="M 178 316 Q 200 330 222 316 Q 200 324 178 316 Z" fill="#a45555" opacity="0.8" />

    ${(markHighlights || [])
      .map(
        (m) => `
      <g>
        <circle cx="${m.x}" cy="${m.y}" r="${m.r}" fill="${m.color}" opacity="0.75" />
      </g>`
      )
      .join('\n')}
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const PRESET_PROFILES: PresetSample[] = [
  {
    id: 'demo-ananya',
    name: 'Ananya (Wheatish · Brown Marks)',
    badge: 'Demo profile, not a real person',
    description: 'Deals with post-acne brown marks on cheeks and mid-day shine; looking for non-greasy products that won’t leave a white cast.',
    answers: {
      lookingFor: ['cleanser', 'moisturizer', 'sunscreen', 'treatment'],
      ageRange: '25 to 34',
      skinTone: 'wheatish',
      concerns: ['brown marks', 'acne', 'oil and shine'],
      middayFeel: 'combination',
      breakoutLevel: 'mild',
      marksDuration: '3 to 12 months',
      sensitivity: 'sometimes',
      healthSituations: [],
      budget: '₹300 to 600',
    },
    imageSvg: createPortraitSvg(
      ['#f4ebe1', '#e8d5c4'],
      '#c2946c',
      '#1a1412',
      'waves',
      [
        { x: 155, y: 275, r: 4, color: '#7a4e2f' },
        { x: 165, y: 285, r: 3, color: '#72482a' },
        { x: 235, y: 270, r: 3.5, color: '#7a4e2f' },
      ]
    ),
    mockFindings: [
      {
        id: 'f-1',
        type: 'brown_marks',
        severity: 'mild',
        zones: ['left_cheek', 'right_cheek'],
        note: 'Scattered hyperpigmented spots on mid-cheeks.',
        enabled: true,
      },
      {
        id: 'f-2',
        type: 'oily_shine',
        severity: 'mild',
        zones: ['forehead', 'nose'],
        note: 'Mild sheen along T-zone.',
        enabled: true,
      },
    ],
  },
  {
    id: 'demo-zuri',
    name: 'Kavita (Deep Brown · Clogged Pores)',
    badge: 'Demo profile, not a real person',
    description: 'Deep brown skin tone with closed comedones and clogged pores; requires 100% white-cast free sun protection.',
    answers: {
      lookingFor: ['cleanser', 'moisturizer', 'sunscreen'],
      ageRange: '35 or older',
      skinTone: 'deep brown',
      concerns: ['clogged pores', 'oil and shine'],
      middayFeel: 'oily',
      breakoutLevel: 'none',
      marksDuration: 'none',
      sensitivity: 'never',
      healthSituations: [],
      budget: '₹300 to 600',
    },
    imageSvg: createPortraitSvg(
      ['#eee1d5', '#d9c0aa'],
      '#825133',
      '#110e0c',
      'curly',
      [
        { x: 195, y: 265, r: 2.5, color: '#54321c' },
        { x: 205, y: 268, r: 2.5, color: '#54321c' },
      ]
    ),
    mockFindings: [
      {
        id: 'f-3',
        type: 'closed_comedones_or_bumps',
        severity: 'mild',
        zones: ['nose', 'forehead'],
        note: 'Small non-inflammatory surface texture bumps.',
        enabled: true,
      },
    ],
  },
  {
    id: 'demo-priya',
    name: 'Priya (Under 18 · Teen Basics)',
    badge: 'Demo profile, not a real person',
    description: '17 years old with oily skin and occasional spots. Safe for teenage skin with gentle basics only (no camera scanning).',
    answers: {
      lookingFor: ['cleanser', 'moisturizer', 'sunscreen'],
      ageRange: 'under 18',
      skinTone: 'medium brown',
      concerns: ['acne', 'oil and shine'],
      middayFeel: 'oily',
      breakoutLevel: 'mild',
      marksDuration: 'under 3 months',
      sensitivity: 'never',
      healthSituations: [],
      budget: 'under ₹300',
    },
    imageSvg: createPortraitSvg(
      ['#f9f3eb', '#ebdcd0'],
      '#a5704a',
      '#241914',
      'sleek',
      [{ x: 185, y: 345, r: 3, color: '#884433' }]
    ),
    mockFindings: [],
  },
  {
    id: 'demo-deep-breakouts',
    name: 'Rohan (Deep & Painful Referral Test)',
    badge: 'Demo profile, not a real person',
    description: 'Demonstrates medical safety referral: deep, swollen and painful breakouts trigger immediate doctor referral.',
    answers: {
      lookingFor: ['cleanser', 'treatment'],
      ageRange: '18 to 24',
      skinTone: 'wheatish',
      concerns: ['acne'],
      middayFeel: 'oily but tight',
      breakoutLevel: 'deep and painful',
      marksDuration: '3 to 12 months',
      sensitivity: 'often',
      healthSituations: [],
      budget: '₹300 to 600',
    },
    imageSvg: createPortraitSvg(
      ['#f5e8e8', '#e8d0d0'],
      '#c2946c',
      '#1a1412',
      'sleek',
      [{ x: 160, y: 280, r: 7, color: '#b93838' }]
    ),
    mockFindings: [
      {
        id: 'f-4',
        type: 'active_pimples',
        severity: 'marked',
        zones: ['left_cheek'],
        note: 'Marked swollen papulopustular lesions with redness.',
        enabled: true,
      },
    ],
  },
];
