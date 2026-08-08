// Relative exam weight per category, used to proportionally sample questions
// across categories when building a quiz. Any category not listed here
// (including "Uncategorized" or any future custom category) falls back to
// DEFAULT_WEIGHT.
//
// Two schemes are combined here:
//   1. FAM901-915  — official NPMCN Primary curriculum course codes, weighted
//      by the objective-question counts in the College's Table of
//      Specifications for the Primary Phase exam.
//   2. Topic categories — from the general medical/health-science bank
//      (questions_1.json). There is no official weighting document for
//      these, so the values below are ESTIMATED based on typical clinical-
//      exam emphasis. Adjust freely — these are a starting point, not a
//      sourced figure like the FAM901-915 values are.

// Full course names for FAM901-915, for display purposes (e.g. showing
// "FAM902 — Anatomy" instead of the bare code on the browse page).
export const COURSE_NAMES = {
  FAM901: "Introduction to Family Medicine",
  FAM902: "Anatomy",
  FAM903: "Embryology (Fetal Development)",
  FAM904: "Genetics and Genomics",
  FAM905: "Physiology",
  FAM906: "Nutrition",
  FAM907: "Medical Biochemistry",
  FAM908: "Pharmacology and Therapeutics",
  FAM909: "Pathology",
  FAM910: "Forensic Medicine (Medicine and the Law)",
  FAM911: "Human Development",
  FAM912: "Sociology",
  FAM913: "Basic Statistics and Statistical Methods",
  FAM914: "Medical Informatics",
  FAM915: "Oral Health",
};

// Convenience: "FAM902" -> "FAM902 - Anatomy"
export function labelFor(category) {
  const name = COURSE_NAMES[category];
  return name ? `${category} - ${name}` : category;
}

export const CATEGORY_WEIGHTS = {
  // --- FAM901-915: official, from the Table of Specifications ---
  FAM901: 15, // Introduction to Family Medicine (corrected from 19)
  FAM902: 19, // Anatomy
  FAM903: 6,  // Embryology (Fetal Development)
  FAM904: 6,  // Genetics and Genomics
  FAM905: 19, // Physiology
  FAM906: 13, // Nutrition
  FAM907: 19, // Medical Biochemistry
  FAM908: 13, // Pharmacology and Therapeutics
  FAM909: 18, // Pathology
  FAM910: 12, // Forensic Medicine (Ethics/Law)
  FAM911: 18, // Human Development
  FAM912: 18, // Sociology
  FAM913: 7,  // Basic Statistics
  FAM914: 6,  // Medical Informatics
  FAM915: 7,  // Oral Health

  // --- Topic categories (questions_1.json): ESTIMATED, no official source ---
  Cardiology: 16,
  "Obstetrics & Gynecology": 14,
  Pediatrics: 14,
  Neurology: 14,
  "Gastroenterology/Hepatology": 13,
  "Nephrology/Urology": 12,
  Endocrinology: 12,
  Pharmacology: 12,
  "Family Medicine": 12,
  Anatomy: 10,
  Hematology: 10,
  Respiratory: 10,
  Psychiatry: 8,
  "Community Medicine/Biostatistics": 8,
  Genetics: 6,
  Immunology: 6,
  "Medical Ethics/Communication": 6,
  Nutrition: 6,
  Ophthalmology: 5,
};

export const DEFAULT_WEIGHT = 10;

export function weightFor(category) {
  return CATEGORY_WEIGHTS[category] ?? DEFAULT_WEIGHT;
}

// Given a pool of questions (already filtered to selected categories) and a
// target total count, pick questions per category proportionally to weight,
// redistributing any shortfall (a category running out of questions) to
// the remaining categories so the total still comes out right when possible.
export function weightedSample(questionsByCategory, totalWanted) {
  const categories = Object.keys(questionsByCategory);
  if (categories.length === 0) return [];

  let remainingCategories = [...categories];
  let remainingWanted = totalWanted;
  const picked = [];

  while (remainingWanted > 0 && remainingCategories.length > 0) {
    const totalWeight = remainingCategories.reduce((sum, c) => sum + weightFor(c), 0);
    let pickedThisRound = 0;
    const stillShort = [];

    for (const cat of remainingCategories) {
      const pool = questionsByCategory[cat].filter(
        (q) => !picked.includes(q)
      );
      const share = Math.max(
        1,
        Math.round((weightFor(cat) / totalWeight) * remainingWanted)
      );
      const take = Math.min(share, pool.length);

      shuffleInPlace(pool);
      picked.push(...pool.slice(0, take));
      pickedThisRound += take;

      if (pool.length > take) stillShort.push(cat); // category has more left, still eligible
    }

    remainingWanted = totalWanted - picked.length;
    remainingCategories = stillShort;

    if (pickedThisRound === 0) break; // nothing left anywhere
  }

  shuffleInPlace(picked);
  return picked.slice(0, totalWanted);
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}