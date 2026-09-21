import { expect, test } from '@playwright/test';
import { newUser, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('@item:S02 Registration with duplicate email', async ({ page }) => {
    const user = await newUser();

    await page.goto(`${UI}/#/register`);

    await page.getByPlaceholder('Username').fill(`${user.username}-duplicate`);
    await page.getByPlaceholder('Email').fill(user.email);
    await page.getByPlaceholder('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign up' }).click();

    const error = page.locator('.error-messages');
    await expect(error).toBeVisible();
    await expect(error).toContainText(/email.*already|already.*email|taken/i);

    await expect(page).toHaveURL(/#\/register$/);
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();
  });
});