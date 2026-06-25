/**
 * Public API for the cube domain module.
 */

export type { CubeState, Face, FaceColor, FaceName, MoveToken } from './types.js'
export { VALID_FACES, MOVE_TOKEN_RE } from './types.js'
export { makeSolvedCube, cloneCube, isSolved, getFaceSolvedColor, getSolvedColorMap } from './state.js'
export { applyMove, applyMoves, invertMove, invertMoves, validateMoveToken, rotateFaceCW, rotateFaceCCW } from './moves.js'
export { generateScramble, validateMoveSequence } from './scramble.js'
export { solve, solveFromScramble, verifySolution } from './solver.js'
