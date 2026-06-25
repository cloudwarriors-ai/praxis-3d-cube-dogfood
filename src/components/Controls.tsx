/**
 * Control panel: Scramble, Reset, Step Solve, Auto Solve buttons.
 */

interface Props {
  solveStatus: string
  isSolving: boolean
  onScramble: () => void
  onReset: () => void
  onStepSolve: () => void
  onAutoSolve: () => void
}

export function Controls({
  solveStatus,
  isSolving,
  onScramble,
  onReset,
  onStepSolve,
  onAutoSolve,
}: Props) {
  const isScrambled = solveStatus === 'scrambled' || solveStatus === 'solving'

  return (
    <div className="controls" data-testid="controls">
      <button
        onClick={onScramble}
        disabled={isSolving}
        data-testid="btn-scramble"
        className="btn btn-primary"
      >
        Scramble
      </button>

      <button
        onClick={onReset}
        disabled={isSolving}
        data-testid="btn-reset"
        className="btn btn-secondary"
      >
        Reset
      </button>

      <button
        onClick={onStepSolve}
        disabled={!isScrambled || isSolving}
        data-testid="btn-step-solve"
        className="btn btn-accent"
      >
        Step Solve
      </button>

      <button
        onClick={onAutoSolve}
        disabled={!isScrambled || isSolving}
        data-testid="btn-auto-solve"
        className="btn btn-accent"
        aria-busy={isSolving}
      >
        {isSolving ? 'Solving…' : 'Auto Solve'}
      </button>
    </div>
  )
}
