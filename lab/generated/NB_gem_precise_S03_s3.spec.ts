import { test, expect } from '@playwright/test';
import { newUser, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('Login with incorrect password', async ({ page }) => {
    // Given a registered user
    const user = await newUser();

    // Given a user is on the login page
    await page.goto(`${UI}/#/login`);

    // When the user submits a registered email and an incorrect password
    await page.getByPlaceholder('Email').fill(user.email);
    await page.getByPlaceholder('Password').fill('incorrect-password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Then the user remains on the login page
    await expect(page).toHaveURL(/#\/login/);

    // And an error message is displayed
    const errorMessage = page.locator('.error-messages');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).not.toBeEmpty();
  });
});