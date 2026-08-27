/**
 * Reducer-level tests for the app cube store.
 *
 * Includes the re-entrancy guard test that catches defect
 * 03-autosolve-double-click: a second BEGIN_SOLVE while already solving must be
 * a no-op (it must not rebuild the solution or rewind progress, which is what
 * lets a double-clicked Auto-Solve duplicate/replay moves).
 */

import { describe, it, expect } from 'vitest'
import { cubeReducer, initialState, type AppState } from '../cubeStore.js'

function scrambled(seed = 42): AppState {
  return cubeReducer(initialState(), { type: 'SCRAMBLE', seed })
}

describe('cubeReducer basics', () => {
  it('starts solved with empty history', () => {
    const s = initialState()
    expect(s.solveStatus).toBe('solved')
    expect(s.history).toHaveLength(0)
    expect(s.isSolving).toBe(false)
  })

  it('SCRAMBLE produces 20 history moves and scrambled status', () => {
    const s = scrambled()
    expect(s.solveStatus).toBe('scrambled')
    expect(s.history).toHaveLength(20)
  })

  it('RESET returns to the solved initial state', () => {
    const s = cubeReducer(scrambled(), { type: 'RESET' })
    expect(s.solveStatus).toBe('solved')
    expect(s.history).toHaveLength(0)
  })

  it('BEGIN_SOLVE builds a solution and enters solving', () => {
    const s = cubeReducer(scrambled(), { type: 'BEGIN_SOLVE' })
    expect(s.isSolving).toBe(true)
    expect(s.solveStatus).toBe('solving')
    expect(s.solution.length).toBeGreaterThan(0)
    expect(s.solutionStep).toBe(0)
  })
})

describe('moveCount badge counter', () => {
  it('moveCount initializes to 0', () => {
    expect(initialState().moveCount).toBe(0)
  })

  it('moveCount resets to 0 after SCRAMBLE', () => {
    let s = scrambled()
    s = cubeReducer(s, { type: 'APPLY_MOVE', token: 'U' })
    expect(s.moveCount).toBe(1)
    const after = cubeReducer(s, { type: 'SCRAMBLE', seed: 99 })
    expect(after.moveCount).toBe(0)
  })

  it('moveCount resets to 0 after RESET', () => {
    let s = scrambled()
    s = cubeReducer(s, { type: 'APPLY_MOVE', token: 'U' })
    expect(cubeReducer(s, { type: 'RESET' }).moveCount).toBe(0)
  })

  it('moveCount increments on APPLY_MOVE', () => {
    let s = scrambled()
    s = cubeReducer(s, { type: 'APPLY_MOVE', token: 'U' })
    s = cubeReducer(s, { type: 'APPLY_MOVE', token: 'R' })
    expect(s.moveCount).toBe(2)
  })

  it('moveCount increments on STEP_SOLVE', () => {
    let s = cubeReducer(scrambled(), { type: 'BEGIN_SOLVE' })
    s = cubeReducer(s, { type: 'STEP_SOLVE' })
    s = cubeReducer(s, { type: 'STEP_SOLVE' })
    expect(s.moveCount).toBe(2)
  })
})

describe('re-entrancy guard (defect 03-autosolve-double-click)', () => {
  it('a second BEGIN_SOLVE while solving is a no-op and does not rewind progress', () => {
    // Scramble, begin solving, then step partway through the solution.
    let s = cubeReducer(scrambled(), { type: 'BEGIN_SOLVE' })
    s = cubeReducer(s, { type: 'STEP_SOLVE' })
    s = cubeReducer(s, { type: 'STEP_SOLVE' })
    expect(s.isSolving).toBe(true)
    const progressBefore = s.solutionStep
    const solutionBefore = s.solution
    expect(progressBefore).toBe(2)

    // Simulate a second Auto-Solve click while already solving.
    const after = cubeReducer(s, { type: 'BEGIN_SOLVE' })

    // The guard must keep us exactly where we were — same solution object,
    // same step. Removing the guard rewinds solutionStep to 0, which is how a
    // double click duplicates/replays moves.
    expect(after.solutionStep).toBe(progressBefore)
    expect(after.solution).toBe(solutionBefore)
    expect(after).toBe(s)
  })
})
