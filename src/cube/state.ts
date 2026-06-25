/**
 * Cube state factory and helpers. No React or Three.js imports.
 */

import type { CubeState, Face, FaceColor } from './types.js'

/** Solved color for each face */
const FACE_SOLVED_COLORS: Record<keyof CubeState, FaceColor> = {
  U: 'W',
  D: 'Y',
  F: 'R',
  B: 'O',
  L: 'B',
  R: 'G',
}

/** Create a single solved face (9 cells, all same color) */
function makeFace(color: FaceColor): Face {
  return Array(9).fill(color) as Face
}

/** Create a fully solved cube state */
export function makeSolvedCube(): CubeState {
  return {
    U: makeFace('W'),
    D: makeFace('Y'),
    F: makeFace('R'),
    B: makeFace('O'),
    L: makeFace('B'),
    R: makeFace('G'),
  }
}

/** Deep-clone a cube state */
export function cloneCube(cube: CubeState): CubeState {
  return {
    U: [...cube.U] as Face,
    D: [...cube.D] as Face,
    F: [...cube.F] as Face,
    B: [...cube.B] as Face,
    L: [...cube.L] as Face,
    R: [...cube.R] as Face,
  }
}

/** Check if a cube is in the solved state */
export function isSolved(cube: CubeState): boolean {
  for (const face of Object.keys(FACE_SOLVED_COLORS) as (keyof CubeState)[]) {
    const expectedColor = FACE_SOLVED_COLORS[face]
    for (const cell of cube[face]) {
      if (cell !== expectedColor) return false
    }
  }
  return true
}

/** Return the solved color for each face — used for color consistency checks */
export function getFaceSolvedColor(face: keyof CubeState): FaceColor {
  return FACE_SOLVED_COLORS[face]
}

/** Return a map of face -> solved color */
export function getSolvedColorMap(): Record<keyof CubeState, FaceColor> {
  return { ...FACE_SOLVED_COLORS }
}
