import { addCard, emptyBoard } from "./board";
import { createBoardId, createCardId } from "./ids";
import type { BoardDoc, Point } from "./types";

/** What a first visit opens: a small, realistic week to play with. */
const SAMPLE: readonly (readonly [string, Point | null])[] = [
  ["Prepare Thursday presentation", { x: 0.84, y: 0.86 }],
  ["Pay the electricity bill", { x: 0.8, y: 0.62 }],
  ["Plan team offsite", { x: 0.3, y: 0.82 }],
  ["Renew passport", { x: 0.16, y: 0.64 }],
  ["Book a meeting room", { x: 0.76, y: 0.34 }],
  ["Answer newsletter survey", { x: 0.72, y: 0.14 }],
  ["Clean the garage", { x: 0.2, y: 0.22 }],
  ["Fix the leaking sink", null],
  ["Learn Spanish", null],
];

export function sampleBoard(): BoardDoc {
  const state = SAMPLE.reduce((s, [text, pos]) => addCard(s, createCardId(), text, pos), emptyBoard());
  return { id: createBoardId(), name: "My week", state };
}
