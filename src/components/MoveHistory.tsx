/**
 * Move history panel: scrollable list of applied moves.
 */

interface Props {
  history: string[]
  solveStatus: string
}

export function MoveHistory({ history, solveStatus }: Props) {
  const statusLabel: Record<string, string> = {
    solved: 'Solved',
    scrambled: `Scrambled (${history.length} moves)`,
    solving: 'Solving…',
    error: 'Error',
  }

  const label = statusLabel[solveStatus] ?? solveStatus

  return (
    <div className="move-history" data-testid="move-history">
      <div className="move-history__status" data-testid="solve-status">
        {label}
      </div>
      <div className="move-history__list" data-testid="history-list">
        {history.length === 0 ? (
          <span className="move-history__empty">No moves yet</span>
        ) : (
          history.map((move, i) => (
            <span key={i} className="move-history__move">
              {move}
            </span>
          ))
        )}
      </div>
    </div>
  )
}
