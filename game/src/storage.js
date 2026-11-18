// The best score, kept in the browser between visits; the game plays fine when storage is blocked.

const KEY = 'orbloom.best';

export function loadBest() {
  try {
    return Number(localStorage.getItem(KEY)) || 0;
  } catch {
    return 0;
  }
}

export function loadDifficultyId() {
  try {
    return localStorage.getItem(`${KEY}.difficulty`) || 'wild';
  } catch {
    return 'wild';
  }
}

export function saveDifficultyId(id) {
  try {
    localStorage.setItem(`${KEY}.difficulty`, id);
  } catch {
    // Not kept: the title screen simply starts on Wild next time.
  }
}

export function saveBest(score) {
  try {
    localStorage.setItem(KEY, String(score));
  } catch {
    // Private windows may refuse storage: the score simply is not kept.
  }
}
