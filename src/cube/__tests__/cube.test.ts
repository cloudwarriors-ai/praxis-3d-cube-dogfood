/**
 * Unit tests for the pure cube domain module.
 *
 * All tests run against src/cube/* with no React or Three.js imports.
 */

import { describe, it, expect } from 'vitest'
import {
  makeSolvedCube,
  isSolved,
  applyMove,
  applyMoves,
  invertMove,
  invertMoves,
  generateScramble,
  validateMoveSequence,
  solve,
  getSolvedColorMap,
  cloneCube,
} from '../index.js'
import { validateMoveToken } from '../moves.js'
import { initialScrambleSeed } from '../scramble.js'

// ────────────────────────────────────────────────────────────
// 1. Solved cube detection
// ────────────────────────────────────────────────────────────
describe('isSolved', () => {
  it('recognises a freshly created cube as solved', () => {
    expect(isSolved(makeSolvedCube())).toBe(true)
  })

  it('returns false after a single move', () => {
    const cube = applyMove(makeSolvedCube(), 'U')
    expect(isSolved(cube)).toBe(false)
  })

  it('returns true after a full-cycle (U U U U)', () => {
    let cube = makeSolvedCube()
    for (let i = 0; i < 4; i++) cube = applyMove(cube, 'U')
    expect(isSolved(cube)).toBe(true)
  })
})

// ────────────────────────────────────────────────────────────
// 2. Move + inverse returns to solved
// ────────────────────────────────────────────────────────────
describe('move and its inverse', () => {
  const moves = ['U', "U'", 'U2', 'D', "D'", 'D2', 'F', "F'", 'F2',
                 'B', "B'", 'B2', 'L', "L'", 'L2', 'R', "R'", 'R2']

  for (const move of moves) {
    it(`applying ${move} then its inverse returns to solved`, () => {
      const start = makeSolvedCube()
      const afterMove = applyMove(start, move)
      const inv = invertMove(move)
      const afterInverse = applyMove(afterMove, inv)
      expect(isSolved(afterInverse)).toBe(true)
    })
  }

  it('invertMoves of a sequence undoes the scramble', () => {
    const moves2 = ['R', 'U', "F'", 'L2', 'B']
    const cube = applyMoves(makeSolvedCube(), moves2)
    expect(isSolved(cube)).toBe(false)
    const undone = applyMoves(cube, invertMoves(moves2))
    expect(isSolved(undone)).toBe(true)
  })
})

// ────────────────────────────────────────────────────────────
// 3. Seeded scramble is deterministic
// ────────────────────────────────────────────────────────────
describe('generateScramble determinism', () => {
  it('same seed produces same sequence', () => {
    const a = generateScramble(42)
    const b = generateScramble(42)
    expect(a).toEqual(b)
  })

  it('different seeds produce different sequences', () => {
    const a = generateScramble(1)
    const b = generateScramble(2)
    expect(a).not.toEqual(b)
  })

  it('produces the expected length', () => {
    expect(generateScramble(99)).toHaveLength(20)
    expect(generateScramble(99, 10)).toHaveLength(10)
  })

  it('all generated tokens pass validation', () => {
    const moves = generateScramble(12345)
    expect(() => validateMoveSequence(moves)).not.toThrow()
  })

  it('no two consecutive moves are on the same face', () => {
    const moves = generateScramble(777)
    for (let i = 1; i < moves.length; i++) {
      expect(moves[i][0]).not.toBe(moves[i - 1][0])
    }
  })
})

// ────────────────────────────────────────────────────────────
// 4. Solver returns cube to solved state for several seeded scrambles
// ────────────────────────────────────────────────────────────
describe('solve', () => {
  const testSeeds = [1, 42, 100, 9999, 31415]

  for (const seed of testSeeds) {
    it(`solves scramble with seed=${seed}`, () => {
      const scrambleMoves = generateScramble(seed)
      const scrambled = applyMoves(makeSolvedCube(), scrambleMoves)
      expect(isSolved(scrambled)).toBe(false)

      const solution = solve(scrambled, scrambleMoves)
      const result = applyMoves(scrambled, solution)
      expect(isSolved(result)).toBe(true)
    })
  }

  it('solve of an already-solved cube returns empty solution', () => {
    const cube = makeSolvedCube()
    // Solved cube with empty scramble — invertMoves([]) = []
    const solution = solve(cube, [])
    expect(solution).toHaveLength(0)
    expect(isSolved(applyMoves(cube, solution))).toBe(true)
  })
})

// ────────────────────────────────────────────────────────────
// 5. Scramble/move validation rejects illegal move tokens
// ────────────────────────────────────────────────────────────
describe('move validation', () => {
  const illegalTokens = ['X', 'u', 'UU', 'U3', 'Q', '', '2', "''", 'F3', 'M']

  for (const token of illegalTokens) {
    it(`validateMoveToken throws for illegal token "${token}"`, () => {
      expect(() => validateMoveToken(token)).toThrow()
    })
  }

  it('validateMoveSequence throws when any token in a sequence is illegal', () => {
    expect(() => validateMoveSequence(['U', 'R', 'X', 'F'])).toThrow()
  })

  it('applyMove throws on illegal token', () => {
    const cube = makeSolvedCube()
    expect(() => applyMove(cube, 'X')).toThrow()
  })

  it('validateMoveSequence does not throw for a valid sequence', () => {
    expect(() => validateMoveSequence(["U", "D'", 'F2', 'R', "B'", 'L2'])).not.toThrow()
  })
})

// ────────────────────────────────────────────────────────────
// 6. Color consistency after reset (reset → exactly solved color layout)
// ────────────────────────────────────────────────────────────
describe('reset color consistency', () => {
  it('freshly made solved cube has exact solved color layout', () => {
    const cube = makeSolvedCube()
    const colorMap = getSolvedColorMap()

    for (const face of Object.keys(colorMap) as (keyof typeof colorMap)[]) {
      const expectedColor = colorMap[face]
      expect(cube[face]).toHaveLength(9)
      for (const sticker of cube[face]) {
        expect(sticker).toBe(expectedColor)
      }
    }
  })

  it('scrambled then reset returns to exact solved colors', () => {
    // Simulate: scramble → verify scrambled → makeSolvedCube (reset) → verify
    const scrambleMoves = generateScramble(42)
    const scrambled = applyMoves(makeSolvedCube(), scrambleMoves)
    expect(isSolved(scrambled)).toBe(false)

    // Reset = make a fresh solved cube
    const reset = makeSolvedCube()
    expect(isSolved(reset)).toBe(true)

    const colorMap = getSolvedColorMap()
    for (const face of Object.keys(colorMap) as (keyof typeof colorMap)[]) {
      for (const sticker of reset[face]) {
        expect(sticker).toBe(colorMap[face])
      }
    }
  })

  it('cloneCube preserves solved state exactly', () => {
    const original = makeSolvedCube()
    const cloned = cloneCube(original)
    expect(cloned).toEqual(original)
    expect(isSolved(cloned)).toBe(true)
  })

  it('U face is all White, D face is all Yellow on a solved cube', () => {
    const cube = makeSolvedCube()
    expect(cube.U.every(c => c === 'W')).toBe(true)
    expect(cube.D.every(c => c === 'Y')).toBe(true)
    expect(cube.F.every(c => c === 'R')).toBe(true)
    expect(cube.B.every(c => c === 'O')).toBe(true)
    expect(cube.L.every(c => c === 'B')).toBe(true)
    expect(cube.R.every(c => c === 'G')).toBe(true)
  })
})

// ────────────────────────────────────────────────────────────
// 7. initialScrambleSeed avoids duplicate-first-scramble bug (#40)
// ────────────────────────────────────────────────────────────
describe('initialScrambleSeed', () => {
  it('timestamps 100 000 ms apart produce different seeds', () => {
    const a = initialScrambleSeed(1_700_000_000_000)
    const b = initialScrambleSeed(1_700_000_100_000)
    expect(a).not.toBe(b)
  })

  it('consecutive increments yield distinct seeds', () => {
    const base = initialScrambleSeed(1_700_000_000_000)
    expect(base + 1).not.toBe(base)
    expect(base + 1).not.toBe(base + 2)
  })

  it('returns a non-negative 32-bit integer', () => {
    const seed = initialScrambleSeed(Date.now())
    expect(seed).toBeGreaterThanOrEqual(0)
    expect(seed).toBeLessThan(2 ** 32)
    expect(Number.isInteger(seed)).toBe(true)
  })
})

// ────────────────────────────────────────────────────────────
// Bonus: README / package.json script consistency check
// ────────────────────────────────────────────────────────────
describe('readme-command consistency', () => {
  it('package.json contains all scripts referenced in README', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const url = await import('url')
    const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
    const root = path.resolve(__dirname, '../../../')

    const pkgRaw = fs.readFileSync(path.join(root, 'package.json'), 'utf-8')
    const pkg = JSON.parse(pkgRaw) as { scripts: Record<string, string> }
    const readmeRaw = fs.readFileSync(path.join(root, 'README.md'), 'utf-8')

    // Extract all `npm run <name>` references from README
    const matches = readmeRaw.matchAll(/npm run (\S+)/g)
    const referencedScripts = [...matches].map(m => m[1])

    for (const script of referencedScripts) {
      expect(
        Object.keys(pkg.scripts),
        `README references "npm run ${script}" but package.json has no such script`,
      ).toContain(script)
    }
  })
})
