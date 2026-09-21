import { test, expect } from '@playwright/test';
import { newUser, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Requirements', () => {
  test('S03: Login with incorrect password', async ({ page }) => {
    const user = await newUser();

    await page.goto(`${UI}/#/login`);

    await page.getByPlaceholder('Email').fill(user.email);
    await page.getByPlaceholder('Password').fill('incorrect-password');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/#\/login$/);
    await expect(page.locator('.error-messages')).toBeVisible();
    await expect(page.locator('.error-messages')).toContainText(/email or password is invalid/i);
  });
});