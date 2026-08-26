/**
 * Cube move application engine. Pure functions, no React/Three imports.
 *
 * Face sticker layout (viewed from the front):
 *
 *         U
 *       0 1 2
 *       3 4 5
 *       6 7 8
 *
 *  L         R
 * 0 1 2   0 1 2
 * 3 4 5   3 4 5
 * 6 7 8   6 7 8
 *
 *         F
 *       0 1 2
 *       3 4 5
 *       6 7 8
 *
 *         D
 *       0 1 2
 *       3 4 5
 *       6 7 8
 *
 *         B (viewed from behind, so indices are mirrored left-right)
 */

import type { CubeState, Face, MoveToken } from './types.js'
import { cloneCube } from './state.js'
import { MOVE_TOKEN_RE } from './types.js'

/**
 * Rotate a face's stickers 90° clockwise (the face itself, not the adjacent stickers).
 */
function rotateFaceCW(face: Face): Face {
  // 0 1 2      6 3 0
  // 3 4 5  ->  7 4 1
  // 6 7 8      8 5 2
  return [
    face[6], face[3], face[0],
    face[7], face[4], face[1],
    face[8], face[5], face[2],
  ] as Face
}

/**
 * Rotate a face's stickers 90° counter-clockwise.
 */
function rotateFaceCCW(face: Face): Face {
  // 0 1 2      2 5 8
  // 3 4 5  ->  1 4 7
  // 6 7 8      0 3 6
  return [
    face[2], face[5], face[8],
    face[1], face[4], face[7],
    face[0], face[3], face[6],
  ] as Face
}

/**
 * Apply a single clockwise quarter-turn of the U face.
 */
function applyU(cube: CubeState): CubeState {
  const c = cloneCube(cube)
  c.U = rotateFaceCW(cube.U)
  // Adjacent: F-top ← R-top ← B-top ← L-top ← F-top (cycle)
  // F top: [0,1,2], R top: [0,1,2], B top: [0,1,2], L top: [0,1,2]
  ;[c.F[0], c.F[1], c.F[2]] = [cube.L[0], cube.L[1], cube.L[2]]
  ;[c.L[0], c.L[1], c.L[2]] = [cube.B[0], cube.B[1], cube.B[2]]
  ;[c.B[0], c.B[1], c.B[2]] = [cube.R[0], cube.R[1], cube.R[2]]
  ;[c.R[0], c.R[1], c.R[2]] = [cube.F[0], cube.F[1], cube.F[2]]
  return c
}

/**
 * Apply a single clockwise quarter-turn of the D face.
 */
function applyD(cube: CubeState): CubeState {
  const c = cloneCube(cube)
  c.D = rotateFaceCW(cube.D)
  // Adjacent: D's band is the bottom row of F, L, B, R
  // F bottom: [6,7,8] -> R bottom, L bottom -> F bottom, etc.
  // CW from below: F-bottom <- L-bottom <- B-bottom <- R-bottom
  ;[c.F[6], c.F[7], c.F[8]] = [cube.R[6], cube.R[7], cube.R[8]]
  ;[c.R[6], c.R[7], c.R[8]] = [cube.B[6], cube.B[7], cube.B[8]]
  ;[c.B[6], c.B[7], c.B[8]] = [cube.L[6], cube.L[7], cube.L[8]]
  ;[c.L[6], c.L[7], c.L[8]] = [cube.F[6], cube.F[7], cube.F[8]]
  return c
}

/**
 * Apply a single clockwise quarter-turn of the F face (viewed from front).
 */
function applyF(cube: CubeState): CubeState {
  const c = cloneCube(cube)
  c.F = rotateFaceCW(cube.F)
  // U bottom row -> R left col -> D top row (reversed) -> L right col (reversed)
  // U[6,7,8] -> R[0,3,6]
  // R[0,3,6] -> D[2,1,0]  (reversed)
  // D[2,1,0] -> L[8,5,2]  (reversed)
  // L[8,5,2] -> U[6,7,8]
  ;[c.R[0], c.R[3], c.R[6]] = [cube.U[6], cube.U[7], cube.U[8]]
  ;[c.D[0], c.D[1], c.D[2]] = [cube.R[6], cube.R[3], cube.R[0]]
  ;[c.L[2], c.L[5], c.L[8]] = [cube.D[0], cube.D[1], cube.D[2]]
  ;[c.U[6], c.U[7], c.U[8]] = [cube.L[8], cube.L[5], cube.L[2]]
  return c
}

/**
 * Apply a single clockwise quarter-turn of the B face (clockwise viewed from back).
 */
function applyB(cube: CubeState): CubeState {
  const c = cloneCube(cube)
  c.B = rotateFaceCW(cube.B)
  // U top row, L left col, D bottom row, R right col
  // U[0,1,2] -> L[0,3,6] reversed? Let's work it out carefully:
  // Viewed from behind, CW = viewed from front CCW
  // B CW (from back): U-top -> L-left-col -> D-bottom -> R-right-col -> U-top
  // U[2,1,0] -> L[0,3,6]
  // L[0,3,6] -> D[6,7,8]? No...
  // Standard notation: B CW (from back):
  //   U top [0,1,2] goes to R right col [2,5,8]  (U[0]->R[2], U[1]->R[5], U[2]->R[8])
  //   R right col [2,5,8] goes to D bottom [8,7,6] (R[2]->D[8], R[5]->D[7], R[8]->D[6])
  //   D bottom [8,7,6] goes to L left col [6,3,0]  (D[8]->L[6], D[7]->L[3], D[6]->L[0])
  //   L left col [6,3,0] goes to U top [0,1,2]     (L[6]->U[0], L[3]->U[1], L[0]->U[2])
  ;[c.R[2], c.R[5], c.R[8]] = [cube.U[0], cube.U[1], cube.U[2]]
  ;[c.D[8], c.D[7], c.D[6]] = [cube.R[2], cube.R[5], cube.R[8]]
  ;[c.L[6], c.L[3], c.L[0]] = [cube.D[8], cube.D[7], cube.D[6]]
  ;[c.U[0], c.U[1], c.U[2]] = [cube.L[6], cube.L[3], cube.L[0]]
  return c
}

/**
 * Apply a single clockwise quarter-turn of the L face (viewed from left).
 */
function applyL(cube: CubeState): CubeState {
  const c = cloneCube(cube)
  c.L = rotateFaceCW(cube.L)
  // L CW (from left):
  //   U left col [0,3,6] -> F left col [0,3,6]
  //   F left col [0,3,6] -> D left col [0,3,6]
  //   D left col [0,3,6] -> B right col reversed [8,5,2]
  //   B right col [2,5,8] -> U left col reversed [6,3,0]
  ;[c.F[0], c.F[3], c.F[6]] = [cube.U[0], cube.U[3], cube.U[6]]
  ;[c.D[0], c.D[3], c.D[6]] = [cube.F[0], cube.F[3], cube.F[6]]
  ;[c.B[2], c.B[5], c.B[8]] = [cube.D[6], cube.D[3], cube.D[0]]
  ;[c.U[0], c.U[3], c.U[6]] = [cube.B[8], cube.B[5], cube.B[2]]
  return c
}

/**
 * Apply a single clockwise quarter-turn of the R face (viewed from right).
 */
function applyR(cube: CubeState): CubeState {
  const c = cloneCube(cube)
  c.R = rotateFaceCW(cube.R)
  // R CW (from right):
  //   U right col [2,5,8] -> B left col reversed [6,3,0]  (U[2]->B[6]? check)
  //   Standard: U right [2,5,8] -> B left [6,3,0] reversed? Let's use known:
  //   U[2,5,8] -> F[2,5,8]? No.
  // Standard R CW:
  //   F right col [2,5,8] -> U right col [2,5,8]
  //   U right col [2,5,8] -> B left col reversed [6,3,0]  (U[2]->B[6], U[5]->B[3], U[8]->B[0])
  //   B left col [0,3,6] -> D right col reversed [8,5,2]  (B[0]->D[8], B[3]->D[5], B[6]->D[2])
  //   D right col [2,5,8] -> F right col [2,5,8]
  ;[c.U[2], c.U[5], c.U[8]] = [cube.F[2], cube.F[5], cube.F[8]]
  ;[c.B[0], c.B[3], c.B[6]] = [cube.U[8], cube.U[5], cube.U[2]]
  ;[c.D[2], c.D[5], c.D[8]] = [cube.B[6], cube.B[3], cube.B[0]]
  ;[c.F[2], c.F[5], c.F[8]] = [cube.D[2], cube.D[5], cube.D[8]]
  return c
}

/** Map from face name to its CW move function */
const CW_MOVES: Record<string, (c: CubeState) => CubeState> = {
  U: applyU,
  D: applyD,
  F: applyF,
  B: applyB,
  L: applyL,
  R: applyR,
}

/**
 * Validate a move token. Throws if illegal.
 */
export function validateMoveToken(token: MoveToken): void {
  if (!MOVE_TOKEN_RE.test(token)) {
    throw new Error(`Illegal move token: "${token}"`)
  }
}

/**
 * Apply a single move token to the cube. Returns a new cube state.
 * Throws on illegal tokens.
 */
export function applyMove(cube: CubeState, token: MoveToken): CubeState {
  validateMoveToken(token)
  const face = token[0]
  const modifier = token[1] || ''
  const moveFn = CW_MOVES[face]

  if (modifier === '2') {
    // Double move = two CW quarter-turns
    return moveFn(moveFn(cube))
  } else if (modifier === "'") {
    // CCW = three CW quarter-turns
    return moveFn(moveFn(moveFn(cube)))
  } else {
    // Single CW
    return moveFn(cube)
  }
}

/**
 * Apply a sequence of move tokens to the cube.
 */
export function applyMoves(cube: CubeState, tokens: MoveToken[]): CubeState {
  return tokens.reduce((c, t) => applyMove(c, t), cube)
}

/**
 * Return the inverse of a move token.
 * U -> U', U' -> U, U2 -> U2
 */
export function invertMove(token: MoveToken): MoveToken {
  validateMoveToken(token)
  const face = token[0]
  const modifier = token[1] || ''
  if (modifier === '2') return token
  if (modifier === "'") return face
  return face + "'"
}

/**
 * Return the inverse of a sequence — reversed with each move inverted.
 */
export function invertMoves(tokens: MoveToken[]): MoveToken[] {
  return [...tokens].reverse().map(invertMove)
}

/**
 * Rotate face stickers CW — exported for testing.
 */
export { rotateFaceCW, rotateFaceCCW }
