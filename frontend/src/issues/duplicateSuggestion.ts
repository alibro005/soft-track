export const MIN_WORDS_TO_SUGGEST = 3
export const MAX_SUGGESTIONS = 3
const wordSegmenter =
  typeof Intl !== 'undefined' && 'Segmenter' in Intl
    ? new Intl.Segmenter(undefined, { granularity: 'word' })
    : null

function getWords(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) return [];

  if (wordSegmenter) {
    return Array.from(wordSegmenter.segment(trimmed))
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

/** Returns the original title text up to the end of the Nth word segment,
 *  preserving CJK characters, punctuation, and original spacing. */
export function getSearchPhrase(
  title: string,
  maxWords: number = MIN_WORDS_TO_SUGGEST,
): string {
  const trimmed = title.trim()

  if (!trimmed) return ''

  if (wordSegmenter) {
    const words = Array.from(wordSegmenter.segment(trimmed)).filter(
      ({ isWordLike }) => isWordLike,
    )

      if (words.length <= maxWords) return trimmed

      const lastWord = words[maxWords - 1]
      const end = lastWord.index + lastWord.segment.length

      return trimmed.slice(0, end)
  }

  return trimmed.split(/\s+/).slice(0, maxWords).join(' ')
}