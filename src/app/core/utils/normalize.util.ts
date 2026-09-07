/**
 * Normalizes a title for comparison purposes.
 * - Converts to lowercase
 * - Removes punctuation and extra whitespace
 * - Removes CJK characters for cross-language matching
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates a simple Levenshtein-like similarity ratio between two strings.
 * Returns a value between 0 (completely different) and 1 (identical).
 */
export function stringSimilarity(a: string, b: string): number {
  const s1 = normalizeTitle(a);
  const s2 = normalizeTitle(b);

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  const editDistance = computeLevenshtein(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Computes the Levenshtein edit distance between two strings.
 */
function computeLevenshtein(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Normalizes a URL by removing trailing slashes and hash fragments.
 */
export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = '';
    const path = u.pathname.replace(/\/+$/, '') || '/';
    return `${u.origin}${path}${u.search}`;
  } catch {
    return url.replace(/\/+$/, '').replace(/#.*$/, '');
  }
}

/**
 * Checks if two titles match, considering alternative titles and similarity.
 */
export function titlesMatch(
  titleA: string,
  titleB: string,
  altTitlesA: string[] = [],
  altTitlesB: string[] = [],
  threshold = 0.85
): boolean {
  const normA = normalizeTitle(titleA);
  const normB = normalizeTitle(titleB);

  if (normA === normB) return true;

  // Check alternative titles
  for (const alt of altTitlesA) {
    if (normalizeTitle(alt) === normB) return true;
  }
  for (const alt of altTitlesB) {
    if (normalizeTitle(alt) === normA) return true;
  }

  // Fuzzy matching
  const similarity = stringSimilarity(titleA, titleB);
  if (similarity >= threshold) return true;

  // Check fuzzy against alt titles
  for (const alt of [...altTitlesA, ...altTitlesB]) {
    const s1 = stringSimilarity(titleA, alt);
    const s2 = stringSimilarity(titleB, alt);
    if (s1 >= threshold || s2 >= threshold) return true;
  }

  return false;
}
