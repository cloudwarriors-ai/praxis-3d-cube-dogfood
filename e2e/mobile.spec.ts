/**
 * Mobile-viewport layout tests.
 *
 * Catches defect 04-mobile-layout-clip: the move-history panel must remain
 * visible and within the viewport bounds at a small (phone) viewport.
 */

import { test, expect } from '@playwright/test'

// Pixel-5-ish portrait viewport, applied explicitly so this test is
// deterministic regardless of which Playwright project runs it.
test.use({ viewport: { width: 393, height: 727 } })

test('move-history panel is visible and within viewport on mobile', async ({ page }) => {
  await page.goto('/')

  const list = page.getByTestId('history-list')
  await expect(list).toBeVisible()

  // The panel must actually render inside the viewport — not clipped to zero
  // height nor pushed off-screen.
  const box = await list.boundingBox()
  expect(box, 'history-list should have a bounding box').not.toBeNull()
  const viewport = page.viewportSize()!
  expect(box!.height, 'history-list height should be > 0').toBeGreaterThan(0)
  expect(box!.width, 'history-list width should be > 0').toBeGreaterThan(0)
  expect(box!.y, 'history-list top should be inside the viewport').toBeLessThan(viewport.height)
  expect(box!.x, 'history-list left should be inside the viewport').toBeLessThan(viewport.width)
})

test('scramble then history is visible/scrollable on mobile', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('btn-scramble').click()
  await expect(page.getByTestId('solve-status')).toHaveText(/scrambled/i)

  const list = page.getByTestId('history-list')
  await expect(list).toBeVisible()
  const box = await list.boundingBox()
  expect(box!.height, 'history-list height should be > 0 after scramble').toBeGreaterThan(0)
})
