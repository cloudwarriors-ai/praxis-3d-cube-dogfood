/**
 * Seeded scramble generator. Pure functions, no React/Three imports.
 * Uses a simple mulberry32 PRNG so scrambles are deterministic by seed.
 */

import type { MoveToken } from './types.js'
import { MOVE_TOKEN_RE } from './types.js'

/** Mulberry32 PRNG — fast, deterministic, sufficient for scramble use */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0
  return function () {
    s += 0x6d2b79f5
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const BASE_FACES = ['U', 'D', 'F', 'B', 'L', 'R'] as const
const MODIFIERS = ['', "'", '2'] as const

/**
 * Generate a deterministic scramble sequence for the given seed.
 * Returns `length` move tokens (default 20), ensuring no consecutive same-face moves.
 */
export function generateScramble(seed: number, length = 20): MoveToken[] {
  const rng = mulberry32(seed)
  const moves: MoveToken[] = []
  let lastFace = ''

  for (let i = 0; i < length; i++) {
    let faceIdx: number
    let face: string
    // Avoid same face twice in a row
    do {
      faceIdx = Math.floor(rng() * BASE_FACES.length)
      face = BASE_FACES[faceIdx]
    } while (face === lastFace)

    const modIdx = Math.floor(rng() * MODIFIERS.length)
    const move: MoveToken = face + MODIFIERS[modIdx]
    moves.push(move)
    lastFace = face
  }

  return moves
}

/** Derive a non-negative 32-bit seed from a millisecond timestamp. */
export function initialScrambleSeed(nowMs: number): number {
  // XOR high and low 32-bit halves so timestamps 2^32 ms (~49.7 days) apart don't collide
  return (nowMs ^ Math.floor(nowMs / 2 ** 32)) >>> 0
}

/**
 * Validate an array of move tokens. Throws on first illegal token.
 */
export function validateMoveSequence(tokens: MoveToken[]): void {
  for (const token of tokens) {
    if (!MOVE_TOKEN_RE.test(token)) {
      throw new Error(`Illegal move token in sequence: "${token}"`)
    }
  }
}
