// Shuffle-bag: serves every id exactly once per cycle, in random order,
// then reshuffles for the next cycle. No repeats until a full pass is done.

/**
 * Unbiased Fisher-Yates shuffle. Does not mutate the input array.
 */
export function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Creates a fresh shuffle-bag state for a given list of ids.
 */
export function createBag(ids) {
  return {
    shuffledOrder: shuffle(ids),
    currentIndex: 0,
    cycleCount: 1,
  };
}

/**
 * Returns the next id to serve, plus the (possibly reshuffled) state to persist.
 * If the underlying id list has changed since the bag was created (new questions
 * added, or a filter changed), pass the fresh `ids` array — this will only
 * reshuffle in the ids you haven't seen yet if you're mid-cycle, otherwise it
 * just adopts the new list at the next cycle boundary, per the spec.
 */
export function drawNext(bag, ids) {
  let { shuffledOrder, currentIndex, cycleCount } = bag;

  const knownIds = new Set(shuffledOrder);
  const idsSet = new Set(ids);
  const listChanged =
    shuffledOrder.length !== ids.length || ![...idsSet].every((id) => knownIds.has(id));

  if (listChanged && currentIndex === 0) {
    // Cycle boundary already reached (or bag never used) — safe to adopt new list now.
    shuffledOrder = shuffle(ids);
  }

  if (currentIndex >= shuffledOrder.length) {
    shuffledOrder = shuffle(listChanged ? ids : shuffledOrder);
    currentIndex = 0;
    cycleCount += 1;
  }

  if (shuffledOrder.length === 0) {
    return { id: null, bag: { shuffledOrder, currentIndex, cycleCount } };
  }

  const id = shuffledOrder[currentIndex];
  const nextState = { shuffledOrder, currentIndex: currentIndex + 1, cycleCount };
  return { id, bag: nextState };
}

const STORAGE_PREFIX = 'shuffle:';

export function loadBag(key) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveBag(key, bag) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(bag));
  } catch {
    // localStorage can throw in private-browsing / quota-exceeded cases — non-fatal,
    // the bag just won't survive a refresh this session.
  }
}

export function clearBag(key) {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_PREFIX + key);
}
