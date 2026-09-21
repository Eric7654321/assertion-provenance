import { test, expect } from '@playwright/test';
import { newUser, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('Registration with duplicate email', async ({ page }) => {
    // Given a user has completed registration with an unused email and logged out
    const existingUser = await newUser();

    // When someone attempts to register again with the same email
    await page.goto(`${UI}/#/register`);
    await page.getByPlaceholder('Your Name').fill('anotheruser');
    await page.getByRole('textbox', { name: 'Email' }).fill(existingUser.email);
    await page.getByPlaceholder('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign up' }).click();

    // Then the registration fails with an error displayed
    const errorMessage = page.locator('.error-messages');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('email has already been taken');

    // And the user is not logged in
    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
  });
});