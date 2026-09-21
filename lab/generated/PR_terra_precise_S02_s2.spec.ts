import { test, expect } from '@playwright/test';
import { newUser, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Criteria', () => {
  test('@item:S02 Registration with duplicate email', async ({ page }) => {
    const user = await newUser();

    await page.goto(`${UI}/#/register`);

    await page.getByPlaceholder('Username').fill(`${user.username}-duplicate`);
    await page.getByPlaceholder('Email').fill(user.email);
    await page.getByPlaceholder('Password').fill('password123');
    await page.getByRole('button', { name: /sign up/i }).click();

    const errorList = page.locator('.error-messages');
    await expect(errorList).toBeVisible();
    await expect(errorList).toContainText(/email.*already|already.*email|taken/i);

    await expect(page).toHaveURL(/#\/register$/);
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
  });
});