# How No Cap was built

This folder shows the process, not the app. The app itself is everything outside this folder.

## prompts/
The prompts used in Google AI Studio (Gemini) to build the first version of the app, in order:
`PASTE_THIS_INTO_AI_STUDIO.txt` (round 1), `FIX_PROMPT.md`, then rounds 3 to 8 (check-ins and compare, referral and date fixes, check-in rule fixes, My shelf, Weekend check, Sunscreen finder). Each round came from problems found by reading the generated code, for example invented reviews in the first version, missing referral rules and client-only checks.

Later changes (the sunscreen finder code, the face scan report, product pictures, picks you can change, the "Know your concern" shortcut, the Vercel deployment) were written and tested directly in this repository.

## mining/
- `analyze.py`: a rule-based script that counts mentions of white cast, breakouts and irritation in reviews. Every number comes from a regex you can read. No AI model is used.
- `community_notes.json`: the hand-checked, paraphrased notes shown as "What Reddit users said" in the app, each with a link to the source comment. Only comments where the product and the experience were in the same sentence were kept.

## Honest notes
- Flipkart's most recent reviews turned out to be mostly one to five words and never mentioned skin tone, so they could not support statistics. The raw counts were also misleading, because people list several products in one comment. That is why the app shows a few paraphrased, linked comments and no percentages.
- None of the rules or picks have been reviewed by a dermatologist yet.
