import { test, expect } from '@playwright/test';
import { newUser, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('S02 Registration with duplicate email', async ({ page }) => {
    const user = await newUser();

    await page.goto(`${UI}/#/register`);

    await page.getByPlaceholder('Username').fill(`${user.username}-duplicate`);
    await page.getByPlaceholder('Email').fill(user.email);
    await page.getByPlaceholder('Password').fill('password123');
    await page.getByRole('button', { name: /sign up/i }).click();

    await expect(page).toHaveURL(/#\/register/);
    await expect(page.locator('.error-messages')).toContainText(/email.*already|email.*taken/i);
  });
});