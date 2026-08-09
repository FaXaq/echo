const ONSETS = [
  "b",
  "c",
  "d",
  "f",
  "g",
  "h",
  "j",
  "k",
  "l",
  "m",
  "n",
  "p",
  "r",
  "s",
  "t",
  "v",
  "w",
  "tr",
  "st",
  "sk",
  "sn",
  "sp",
  "fl",
  "gr",
  "pl",
  "dr",
  "kr",
  "fr",
];
const VOWELS = ["a", "e", "i", "o", "u"];
const CODAS = ["n", "s", "k", "r", "d", "l", "t", "m", "rd", "nk", "sk", "nd", "lt", ""];

function randomFrom<T>(values: T[]): T {
  return values[Math.floor(Math.random() * values.length)]!;
}

function generateWord(syllables = 2): string {
  let word = "";
  for (let i = 0; i < syllables; i++) {
    word += randomFrom(ONSETS) + randomFrom(VOWELS) + randomFrom(CODAS);
  }
  return word;
}

export function generateOrgSlug(): string {
  return [generateWord(), generateWord(), generateWord()].join("-");
}
