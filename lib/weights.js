// Relative exam weight per category, mirroring the real FMCFM exam's
// emphasis on each course. Used to proportionally sample questions across
// categories when building a quiz. Any category not listed here (including
// "Uncategorized" or custom categories you add later) falls back to
// DEFAULT_WEIGHT.

export const CATEGORY_WEIGHTS = {
  FAM901: 19, // Introduction to Family Medicine
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
