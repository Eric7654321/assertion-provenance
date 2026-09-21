import { test, expect } from '@playwright/test';
import { newUser, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Requirements', () => {
  test('Registration with duplicate email should not succeed', async ({ page }) => {
    // Given a user completes registration with an unused email
    const existingUser = await newUser();

    // And the user logs out (already starting in a clean browser session / unauthenticated)
    // When the user registers again with the same email
    await page.goto(`${UI}/#/register`);

    const uniqueUsername = `user_${Date.now()}`;
    await page.getByPlaceholder('Your Name').fill(uniqueUsername);
    await page.getByPlaceholder('Email').fill(existingUser.email);
    await page.getByPlaceholder('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign up' }).click();

    // Then the second registration should not succeed
    // Verify that we remain on the register page and/or an error message is displayed
    await expect(page).toHaveURL(/#\/register/);
    await expect(page.locator('.error-messages')).toBeVisible();
    await expect(page.locator('.error-messages')).toContainText(/email/i);
  });
});