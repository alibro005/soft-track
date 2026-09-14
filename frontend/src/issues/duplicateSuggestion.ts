export const MIN_WORDS_TO_SUGGEST = 3
export const MAX_SUGGESTIONS = 3

function getWords(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) return [];

  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter(undefined, {
      granularity: 'word',
    });

    return Array.from(segmenter.segment(trimmed))
      .filter(({ isWordLike }) => isWordLike)
      .map(({ segment }) => segment);
  }

  return trimmed.split(/\s+/).filter(Boolean);
}

/** Counts words, including scripts without whitespace such as CJK. */
export function wordCount(value: string): number {
  return getWords(value).length
}

export function shouldShowSuggestions(
  title: string,
  dismissed: boolean,
): boolean {
  return !dismissed && wordCount(title) >= MIN_WORDS_TO_SUGGEST;
}

/** Search ANDs every term server-side, so a longer title matches less, not
 *  more. Freezing the query at the trigger width keeps later title words from
 *  suppressing matches. */
export function getSearchPhrase(
  title: string,
  maxWords: number = MIN_WORDS_TO_SUGGEST,
): string {
  return getWords(title).slice(0, maxWords).join(' ')
}