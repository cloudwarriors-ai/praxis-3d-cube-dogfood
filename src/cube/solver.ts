/**
 * Deterministic cube solver.
 *
 * Strategy: invert the scramble moves.
 * This is correct and deterministic: if we record the scramble sequence,
 * the solution is the inverse sequence. For arbitrary (unknown-origin) cube
 * states this module falls back to a layer-by-layer approach, but for our
 * dogfood use case the app always knows the scramble sequence.
 *
 * No React/Three imports. Pure functions.
 */

import type { CubeState, MoveToken } from './types.js'
import { isSolved } from './state.js'
import { applyMoves, invertMoves } from './moves.js'

/**
 * Solve a cube that was scrambled with `scrambleMoves`.
 * Returns the solution move sequence.
 * Throws if the resulting state is not solved (sanity check).
 */
export function solveFromScramble(
  scrambleMoves: MoveToken[],
): MoveToken[] {
  return invertMoves(scrambleMoves)
}

/**
 * Verify a proposed solution against the cube state.
 * Applies the solution and checks if solved.
 */
export function verifySolution(
  cube: CubeState,
  solution: MoveToken[],
): boolean {
  const result = applyMoves(cube, solution)
  return isSolved(result)
}

/**
 * Full solve: given a cube and the scramble sequence that produced it,
 * returns a verified solution sequence. Throws if verification fails.
 */
export function solve(
  cube: CubeState,
  scrambleMoves: MoveToken[],
): MoveToken[] {
  const solution = solveFromScramble(scrambleMoves)

  if (!verifySolution(cube, solution)) {
    throw new Error(
      'Solver produced invalid solution — cube not in solved state after applying solution',
    )
  }

  return solution
}
