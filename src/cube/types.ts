/**
 * Pure cube domain types. No React or Three.js imports allowed here.
 */

/** The 6 face colors of a standard Rubik's cube */
export type FaceColor = 'W' | 'Y' | 'R' | 'O' | 'B' | 'G'

/** Face names: Up, Down, Front, Back, Left, Right */
export type FaceName = 'U' | 'D' | 'F' | 'B' | 'L' | 'R'

/**
 * A face is a 3x3 grid of colors, stored as a flat 9-element array.
 * Indices:
 *   0 1 2
 *   3 4 5
 *   6 7 8
 */
export type Face = FaceColor[]

/**
 * Full cube state: one Face per face name.
 */
export interface CubeState {
  U: Face
  D: Face
  F: Face
  B: Face
  L: Face
  R: Face
}

/**
 * A move token in standard notation.
 * e.g. "U", "U'", "U2", "D", "D'", "D2", etc.
 */
export type MoveToken = string

/** The set of valid base face moves */
export const VALID_FACES = new Set<string>(['U', 'D', 'F', 'B', 'L', 'R'])

/** Regex for valid move tokens */
export const MOVE_TOKEN_RE = /^[UDFBLR][2']?$/
