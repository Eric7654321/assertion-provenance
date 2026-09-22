import { test, expect } from '@playwright/test';
import { newUser, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('@item:S02 Registration with duplicate email', async ({ page }) => {
    const user = await newUser();

    await page.goto(`${UI}/#/login`);
    await page.getByRole('link', { name: /sign up/i }).click();

    await page.getByPlaceholder('Username').fill(`${user.username}-duplicate`);
    await page.getByPlaceholder('Email').fill(user.email);
    await page.getByPlaceholder('Password').fill(user.password);
    await page.getByRole('button', { name: /sign up/i }).click();

    await expect(page).toHaveURL(/#\/register/);
    await expect(page.locator('.error-messages')).toBeVisible();
    await expect(page.locator('.error-messages')).toContainText(/email/i);

    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /new article/i })).toHaveCount(0);
  });
});