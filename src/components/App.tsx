/**
 * Root application component.
 */

import { useReducer, useCallback, useRef, useEffect } from 'react'
import { CubeCanvas } from './CubeCanvas.js'
import { Controls } from './Controls.js'
import { MoveHistory } from './MoveHistory.js'
import { cubeReducer, initialState } from '../store/cubeStore.js'
import { initialScrambleSeed } from '../cube/scramble.js'

let seedCounter = initialScrambleSeed(Date.now())

export function App() {
  const [state, dispatch] = useReducer(cubeReducer, undefined, initialState)
  // Track if auto-solve timer is running (separate from isSolving to avoid stale closure)
  const isAutoSolvingRef = useRef(false)
  const solveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // When isSolving flips to false (solve done or reset), clear the timer
  useEffect(() => {
    if (!state.isSolving && solveTimerRef.current !== null) {
      clearInterval(solveTimerRef.current)
      solveTimerRef.current = null
      isAutoSolvingRef.current = false
    }
  }, [state.isSolving])

  const stopSolveTimer = useCallback(() => {
    if (solveTimerRef.current !== null) {
      clearInterval(solveTimerRef.current)
      solveTimerRef.current = null
    }
    isAutoSolvingRef.current = false
  }, [])

  const handleScramble = useCallback(() => {
    if (state.isSolving) return
    stopSolveTimer()
    dispatch({ type: 'SCRAMBLE', seed: ++seedCounter })
  }, [state.isSolving, stopSolveTimer])

  const handleReset = useCallback(() => {
    if (state.isSolving) return
    stopSolveTimer()
    dispatch({ type: 'RESET' })
  }, [state.isSolving, stopSolveTimer])

  const handleStepSolve = useCallback(() => {
    if (state.isSolving) return
    if (state.solveStatus !== 'scrambled' && state.solveStatus !== 'solving') return

    if (state.solveStatus === 'scrambled') {
      dispatch({ type: 'BEGIN_SOLVE' })
    } else {
      dispatch({ type: 'STEP_SOLVE' })
    }
  }, [state.isSolving, state.solveStatus])

  const handleAutoSolve = useCallback(() => {
    // Re-entrancy guard: do nothing if already auto-solving
    if (isAutoSolvingRef.current) return
    if (state.isSolving) return
    if (state.solveStatus !== 'scrambled' && state.solveStatus !== 'solving') return

    isAutoSolvingRef.current = true

    // Kick off the solve (builds the solution sequence in state)
    dispatch({ type: 'BEGIN_SOLVE' })

    // Animate one step every 300ms
    solveTimerRef.current = setInterval(() => {
      dispatch({ type: 'STEP_SOLVE' })
    }, 300)
  }, [state.isSolving, state.solveStatus])

  return (
    <div className="app">
      <header className="app__header">
        <h1>3D Rubik&apos;s Cube</h1>
      </header>
      <main className="app__main">
        <div className="app__canvas-area">
          <CubeCanvas cubeState={state.cube} />
        </div>
        <aside className="app__sidebar">
          <Controls
            solveStatus={state.solveStatus}
            isSolving={state.isSolving}
            onScramble={handleScramble}
            onReset={handleReset}
            onStepSolve={handleStepSolve}
            onAutoSolve={handleAutoSolve}
          />
          <MoveHistory
            history={state.history}
            solveStatus={state.solveStatus}
          />
          {state.errorMessage && (
            <div className="app__error" data-testid="error-message">
              {state.errorMessage}
            </div>
          )}
        </aside>
      </main>
    </div>
  )
}
