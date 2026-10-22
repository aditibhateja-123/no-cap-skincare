"""Rule-based review mining. No AI model: every number comes from a regex you can read.

Usage: python3 analyze.py reviews.json out.json
reviews.json is a list of Flipkart review records (recordType == 'review') plus product summaries.
"""
import json, re, sys
from collections import defaultdict

NEG = r"(?:no|zero|without|not|never|nahi|nhi|n't|dont|don't|doesnt|doesn't|didnt|didn't|isnt|isn't|hardly|barely)"
GAP = r"(?:\W+\w+){0,4}?\W+"

def neg_near(term):
    return re.compile(rf"\b{NEG}\b{GAP}(?:{term})|\b\w*n't\b{GAP}(?:{term})", re.I)

CAST = r"white ?cast|whitish|white layer|white film|white patch|ashy|chalky|grey cast|gray cast|white residue|white tint|looks white|turns white|white look|white face|white marks"
BREAK = r"break ?outs?|pimples?|acne|zits|clog+ed|comedone|whitehead|blackhead"
IRRIT = r"stings?|stinging|burn(?:s|ing|t)?|irritat\w*|rash(?:es)?|itch\w*|allerg\w*|redness|red patches|watery eyes|eyes? (?:burn|sting|water)"
GREASY = r"greasy|oily|sticky|shiny|shine|oil slick|heavy"
PILL = r"pill(?:s|ing)?|flak\w*|balling|clump\w*|patchy"
MATTE = r"matte|non[- ]?greasy|not greasy|lightweight|light weight|absorbs? (?:quickly|fast)|dry touch|no stick"

RE_CAST, RE_NEG_CAST = re.compile(CAST, re.I), neg_near(CAST)
RE_BREAK, RE_NEG_BREAK = re.compile(BREAK, re.I), neg_near(BREAK)
RE_IRRIT, RE_NEG_IRRIT = re.compile(IRRIT, re.I), neg_near(IRRIT)
RE_GREASY, RE_NEG_GREASY = re.compile(GREASY, re.I), neg_near(GREASY)
RE_PILL = re.compile(PILL, re.I)
RE_MATTE = re.compile(MATTE, re.I)

DEEP = re.compile(r"\bdusky\b|dark skin|dark complexion|darker skin|brown skin|wheatish|\btan(?:ned)?\b|deep skin|medium skin|dark[- ]toned|dark tone|indian skin|dark colou?r", re.I)
LIGHT = re.compile(r"fair skin|light skin|fair complexion|very fair|\bfair\b|pale", re.I)
OILY = re.compile(r"oily skin|oily face|oily type|combination skin|oil[- ]prone|acne[- ]prone|acne prone", re.I)
DRY = re.compile(r"dry skin|dry face|very dry", re.I)
SENS = re.compile(r"sensitive skin|sensitive type|eczema", re.I)


def classify(text):
    t = text.lower()
    out = {}
    out["cast_report"] = bool(RE_CAST.search(t)) and not RE_NEG_CAST.search(t)
    out["cast_none"] = bool(RE_NEG_CAST.search(t))
    out["break_report"] = bool(RE_BREAK.search(t)) and not RE_NEG_BREAK.search(t)
    out["break_none"] = bool(RE_NEG_BREAK.search(t))
    out["irrit_report"] = bool(RE_IRRIT.search(t)) and not RE_NEG_IRRIT.search(t)
    out["irrit_none"] = bool(RE_NEG_IRRIT.search(t))
    out["greasy_report"] = bool(RE_GREASY.search(t)) and not RE_NEG_GREASY.search(t) and not RE_MATTE.search(t)
    out["light_feel"] = bool(RE_MATTE.search(t)) or bool(RE_NEG_GREASY.search(t))
    out["pilling"] = bool(RE_PILL.search(t))
    out["deep"] = bool(DEEP.search(t))
    out["light"] = bool(LIGHT.search(t)) and not out["deep"]
    out["oily"] = bool(OILY.search(t))
    out["dry"] = bool(DRY.search(t))
    out["sensitive"] = bool(SENS.search(t))
    return out


def analyse(records):
    by = defaultdict(lambda: {"reviews": [], "summary": None})
    for r in records:
        key = r.get("productKey") or r.get("productUrl")
        if r.get("recordType") == "product_summary":
            by[key]["summary"] = r
        elif r.get("recordType") == "review" and (r.get("body") or r.get("title")):
            by[key]["reviews"].append(r)
    results = {}
    for key, d in by.items():
        revs = d["reviews"]
        n = len(revs)
        if n == 0:
            continue
        tally = defaultdict(int)
        deep_tally = defaultdict(int)
        for r in revs:
            text = f"{r.get('title') or ''}. {r.get('body') or ''}"
            c = classify(text)
            r["_c"] = c
            for k, v in c.items():
                if v:
                    tally[k] += 1
                    if c["deep"]:
                        deep_tally[k] += 1
        results[key] = {
            "url": (d["summary"] or revs[0]).get("productUrl"),
            "n": n,
            "avg_rating_sample": round(sum(r.get("rating") or 0 for r in revs) / n, 2),
            "summary": {k: d["summary"].get(k) for k in ("totalRatings", "totalReviews", "averageRating")} if d["summary"] else None,
            "tally": dict(tally),
            "deep_n": tally["deep"],
            "deep_tally": dict(deep_tally),
            "reviews": revs,
        }
    return results


if __name__ == "__main__":
    data = json.load(open(sys.argv[1]))
    res = analyse(data)
    slim = {k: {kk: vv for kk, vv in v.items() if kk != "reviews"} for k, v in res.items()}
    json.dump(slim, open(sys.argv[2], "w"), indent=1)
    for k, v in res.items():
        t = v["tally"]
        print(f"\n{k[:70]}  n={v['n']} avg={v['avg_rating_sample']}")
        print("  cast reported:", t.get("cast_report", 0), "| says no cast:", t.get("cast_none", 0),
              "| breakouts reported:", t.get("break_report", 0), "| says no breakouts:", t.get("break_none", 0))
        print("  irritation:", t.get("irrit_report", 0), "| greasy:", t.get("greasy_report", 0),
              "| light feel:", t.get("light_feel", 0), "| pilling:", t.get("pilling", 0))
        print("  deeper-tone reviewers:", v["deep_n"], "->", {k2: v["deep_tally"].get(k2, 0) for k2 in ("cast_report", "cast_none", "break_report")})
