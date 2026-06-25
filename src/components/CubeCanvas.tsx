/**
 * Three.js canvas component. Instantiates CubeRenderer and keeps it in sync
 * with the cube state passed as props.
 */

import { useEffect, useRef } from 'react'
import { CubeRenderer } from '../three/cubeRenderer.js'
import type { CubeState } from '../cube/index.js'

interface Props {
  cubeState: CubeState
}

export function CubeCanvas({ cubeState }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<CubeRenderer | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const renderer = new CubeRenderer(canvasRef.current)
    rendererRef.current = renderer
    renderer.updateCubeState(cubeState)
    return () => {
      renderer.dispose()
      rendererRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // mount once

  useEffect(() => {
    rendererRef.current?.updateCubeState(cubeState)
  }, [cubeState])

  return (
    <canvas
      ref={canvasRef}
      data-testid="cube-canvas"
      style={{ width: '100%', height: '100%', display: 'block', cursor: 'grab' }}
    />
  )
}
