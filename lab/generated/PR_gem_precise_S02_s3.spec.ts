import { test, expect } from '@playwright/test';
import { newUser, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('Registration with duplicate email', async ({ page }) => {
    // Given a user completes registration with an unused email and logs out
    const existingUser = await newUser();

    // When the user registers again with the same email
    await page.goto(`${UI}/#/register`);

    await page.getByRole('textbox', { name: 'Your Name' }).fill(`another_${Date.now()}`);
    await page.getByRole('textbox', { name: 'Email' }).fill(existingUser.email);
    await page.getByRole('textbox', { name: 'Password' }).fill('validpassword123');
    await page.getByRole('button', { name: 'Sign up' }).click();

    // Then the registration fails with an error displayed
    const errorMessage = page.locator('.error-messages');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('email');

    // And the user is not logged in
    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
  });
});