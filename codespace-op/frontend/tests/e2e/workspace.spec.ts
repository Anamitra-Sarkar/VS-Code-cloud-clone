import { test, expect } from '@playwright/test';

test.describe('Workspace IDE', () => {
  test('should show landing page with Build Now button', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Codespace-OP')).toBeVisible();
    await expect(page.getByRole('button', { name: /build now/i })).toBeVisible();
  });

  test('should navigate to auth page on Build Now click', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /build now/i }).click();
    await expect(page).toHaveURL('/auth');
    await expect(page.getByText('Welcome to')).toBeVisible();
  });

  test('should display auth form with sign in and sign up tabs', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.getByText('Sign In')).toBeVisible();
    await expect(page.getByText('Sign Up')).toBeVisible();
    await expect(page.getByText('Continue with Google')).toBeVisible();
  });

  test('should toggle between sign in and sign up modes', async ({ page }) => {
    await page.goto('/auth');
    await page.getByText('Sign Up').click();
    await expect(page.getByPlaceholder('Full Name')).toBeVisible();
    await expect(page.getByPlaceholder('Confirm Password')).toBeVisible();
    await page.getByText('Sign In').click();
    await expect(page.getByPlaceholder('Full Name')).not.toBeVisible();
  });
});
