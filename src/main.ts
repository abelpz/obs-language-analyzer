import './style.css';
import xre from 'xregexp';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>

    <h1>Language Analyzer</h1>
    <div class="card">
      An application for analyzing a language using an OBS translation.
    </div>
    <p class="read-the-docs">
      idiomasPuentes
    </p>
  </div>
`;

async function getStories(org, lang, refresh = false) {
  if (!org || !lang) return;
  const storiesCount = 50;
  const storiesPromises: Promise<string>[] | string[] = [];
  for (let i = 1; i <= storiesCount; i++) {
    const storyId = String(i).padStart(2, '0');
    const storyKey = `${org}.${lang}.story:${storyId}`;
    let story: string | Promise<string> | null;
    story = refresh ? null : window.localStorage.getItem(storyKey);

    if (!story) {
      const storyPromiseUrl = `https://git.door43.org/${org}/${lang}_obs/raw/branch/master/content/${storyId}.md`;
      story = fetch(storyPromiseUrl)
        .then((r) => r.text())
        .then((s) => {
          const cleanString = s.replace(
            /(!\[.+?\)\n+)|(#.+\n+)|(_.+_\n+)/gm,
            ''
          );
          window.localStorage.setItem(storyKey, cleanString);
          return s;
        });
      if (!story) throw new Error('Story not found');
    }
    storiesPromises.push(story);
  }
  return Promise.all(storiesPromises);
}

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!);

const tokenizeString = (input: string): string[] => {
  const normalizedInput = input.normalize('NFC');
  // Regular expression to match word-like strings in multiple languages
  // This includes extended Latin characters, numbers, and apostrophes
  const wordRegex = xre('([\\p{L}\\p{M}]+)', 'gu');

  // Use the regex to split the input string into an array of tokens
  const tokens = normalizedInput.match(wordRegex) || [];
  return tokens;
};

const countLetters = (
  input: string
): {
  [key: string]: {
    count: number;
    before: { [key: string]: number };
    after: { [key: string]: number };
    start: number;
    end: number;
  };
} => {
  const letterCounts: {
    [key: string]: {
      count: number;
      before: { [key: string]: number };
      after: { [key: string]: number };
      start: number;
      end: number;
    };
  } = {};

  // Normalize the input to treat combined characters as single letters

  const words = tokenizeString(input) || [];

  words.forEach((word) => {
    const wordLettersRegex = xre('(\\p{L}\\p{M}*)', 'gu');
    const wordLetters = word.match(wordLettersRegex);
    if (!wordLetters) return;
    for (let i = 0; i < wordLetters.length; i++) {
      const letter = wordLetters[i].toLowerCase();
      if (!letterCounts[letter]) {
        letterCounts[letter] = {
          count: 0,
          before: {},
          after: {},
          start: 0,
          end: 0,
        };
      }
      letterCounts[letter].count++;

      // Count letters before and after
      if (i > 0) {
        const beforeLetter = wordLetters[i - 1].toLowerCase();
        letterCounts[letter].before[beforeLetter] =
          (letterCounts[letter].before[beforeLetter] || 0) + 1;
      }
      if (i < wordLetters.length - 1) {
        const afterLetter = wordLetters[i + 1].toLowerCase();
        letterCounts[letter].after[afterLetter] =
          (letterCounts[letter].after[afterLetter] || 0) + 1;
      }
    }
    // Count if the letter is at the start or end of the word
    letterCounts[wordLetters[0].toLowerCase()].start++;
    letterCounts[wordLetters[wordLetters.length - 1].toLowerCase()].end++;
  });

  return letterCounts;
};

getStories('es-419_gl', 'es-419')
  .then((r) => r?.join(''))
  .then((stories) => {
    const letterStatistics = countLetters(stories);

    console.log(
      new Map(
        Object.entries(letterStatistics).sort((a, b) => {
          return b[1].count - a[1].count;
        })
      )
    );
  });
