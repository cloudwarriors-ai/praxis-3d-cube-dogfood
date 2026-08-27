/**
 * Playwright smoke tests for the 3D cube app.
 * Runs against the dev server (see playwright.config.ts webServer).
 */

import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('app loads with title and canvas', async ({ page }) => {
  await expect(page.getByRole('heading', { name: /rubik/i })).toBeVisible()
  // Three.js renders into a <canvas>
  await expect(page.locator('canvas')).toBeVisible()
})

test('initial status is solved and history empty', async ({ page }) => {
  await expect(page.getByTestId('solve-status')).toHaveText(/solved/i)
  await expect(page.getByTestId('history-list')).toContainText(/no moves yet/i)
})

test('scramble changes status and populates move history', async ({ page }) => {
  await page.getByTestId('btn-scramble').click()
  await expect(page.getByTestId('solve-status')).toHaveText(/scrambled/i)
  // 20 move tokens should appear in history
  const moves = page.locator('.move-history__move')
  await expect(moves).toHaveCount(20)
})

test('preview-gate caption is visible', async ({ page }) => {
  await expect(page.getByTestId('preview-caption')).toBeVisible()
  await expect(page.getByTestId('preview-caption')).toHaveText('preview-gate harness: capacity-2 20260827T164600Z')
})

test('auto-solve returns the cube to solved', async ({ page }) => {
  await page.getByTestId('btn-scramble').click()
  await expect(page.getByTestId('solve-status')).toHaveText(/scrambled/i)

  await page.getByTestId('btn-auto-solve').click()
  // Auto-solve animates one step per 300ms; 20 moves -> ~6s. Allow generous timeout.
  await expect(page.getByTestId('solve-status')).toHaveText(/solved/i, { timeout: 20000 })
})
