/**
 * App-level cube state store. React-aware wrapper around the pure cube domain.
 * Uses React useReducer/Context pattern so the view stays thin.
 */

import type { CubeState, MoveToken } from '../cube/index.js'
import {
  makeSolvedCube,
  applyMove,
  applyMoves,
  generateScramble,
  solve,
  isSolved,
} from '../cube/index.js'

export type SolveStatus =
  | 'solved'
  | 'scrambled'
  | 'solving'
  | 'error'

export interface AppState {
  cube: CubeState
  scrambleMoves: MoveToken[]
  history: MoveToken[]
  solution: MoveToken[]
  solutionStep: number
  solveStatus: SolveStatus
  isSolving: boolean
  errorMessage: string | null
}

export type AppAction =
  | { type: 'RESET' }
  | { type: 'SCRAMBLE'; seed: number }
  | { type: 'APPLY_MOVE'; token: MoveToken }
  | { type: 'BEGIN_SOLVE' }
  | { type: 'STEP_SOLVE' }
  | { type: 'SOLVE_COMPLETE' }
  | { type: 'SET_ERROR'; message: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_SOLVING_FLAG'; value: boolean }

export function initialState(): AppState {
  return {
    cube: makeSolvedCube(),
    scrambleMoves: [],
    history: [],
    solution: [],
    solutionStep: 0,
    solveStatus: 'solved',
    isSolving: false,
    errorMessage: null,
  }
}

export function cubeReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'RESET': {
      return initialState()
    }

    case 'SCRAMBLE': {
      const scrambleMoves = generateScramble(action.seed)
      const cube = applyMoves(makeSolvedCube(), scrambleMoves)
      return {
        ...state,
        cube,
        scrambleMoves,
        history: [...scrambleMoves],
        solution: [],
        solutionStep: 0,
        solveStatus: 'scrambled',
        isSolving: false,
        errorMessage: null,
      }
    }

    case 'APPLY_MOVE': {
      const cube = applyMove(state.cube, action.token)
      const history = [...state.history, action.token]
      const solved = isSolved(cube)
      return {
        ...state,
        cube,
        history,
        solveStatus: solved ? 'solved' : state.solveStatus,
      }
    }

    case 'BEGIN_SOLVE': {
      if (isSolved(state.cube)) return state

      try {
        const solution = solve(state.cube, state.scrambleMoves)
        return {
          ...state,
          solution,
          solutionStep: 0,
          solveStatus: 'solving',
          isSolving: true,
          errorMessage: null,
        }
      } catch (e) {
        return {
          ...state,
          solveStatus: 'error',
          errorMessage: e instanceof Error ? e.message : String(e),
        }
      }
    }

    case 'STEP_SOLVE': {
      if (!state.isSolving || state.solutionStep >= state.solution.length) {
        return state
      }
      const token = state.solution[state.solutionStep]
      const cube = applyMove(state.cube, token)
      const solutionStep = state.solutionStep + 1
      const history = [...state.history, token]
      const done = solutionStep >= state.solution.length

      return {
        ...state,
        cube,
        history,
        solutionStep,
        solveStatus: done ? 'solved' : 'solving',
        isSolving: !done,
      }
    }

    case 'SOLVE_COMPLETE': {
      return {
        ...state,
        solveStatus: 'solved',
        isSolving: false,
      }
    }

    case 'SET_SOLVING_FLAG': {
      return { ...state, isSolving: action.value }
    }

    case 'SET_ERROR': {
      return {
        ...state,
        solveStatus: 'error',
        isSolving: false,
        errorMessage: action.message,
      }
    }

    case 'CLEAR_ERROR': {
      return { ...state, errorMessage: null }
    }

    default:
      return state
  }
}
