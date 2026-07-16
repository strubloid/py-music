import { expect, test } from '@playwright/test'

test('sidebar keeps the user-selected state across play navigation and reloads', async ({ page }) => {
  await page.goto('/learn/scales')
  await page.evaluate(() => window.localStorage.removeItem('sidebarCollapsed'))
  await page.reload()

  const collapseSidebar = page.getByRole('button', { name: 'Collapse sidebar' })
  await expect(collapseSidebar).toBeVisible()
  await collapseSidebar.click()
  await expect(page.getByRole('button', { name: 'Expand sidebar' })).toBeVisible()

  await page.getByRole('button', { name: 'Challenges' }).click()
  await expect(page).toHaveURL(/\/play\/daily$/)
  await expect(page.getByRole('button', { name: 'Expand sidebar' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Expand sidebar' })).toBeVisible()

  await page.getByRole('button', { name: 'Expand sidebar' }).click()
  await expect(page.getByRole('button', { name: 'Collapse sidebar' })).toBeVisible()
  await page.getByRole('button', { name: 'Ear Training' }).click()
  await expect(page).toHaveURL(/\/play\/ear-training$/)
  await expect(page.getByRole('button', { name: 'Collapse sidebar' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Collapse sidebar' })).toBeVisible()
})
