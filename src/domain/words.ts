/**
 * Counts in words ("Two cards"), since the only numbers on screen should be
 * list positions. Past twenty the words stop helping, so digits come back.
 */
const WORDS = [
  "No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen",
  "Eighteen", "Nineteen", "Twenty",
];

export function countInWords(n: number, singular: string, plural = `${singular}s`): string {
  return `${WORDS[n] ?? n} ${n === 1 ? singular : plural}`;
}
