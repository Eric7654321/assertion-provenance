import { test, expect } from '@playwright/test';
import { newUser, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Criteria', () => {
  test('Registration with duplicate email', async ({ page }) => {
    // Given a user has registered with an unused email
    // And has logged out
    const existingUser = await newUser();

    // When the user attempts to register again with the same email
    await page.goto(`${UI}/#/register`);

    await page.getByRole('textbox', { name: 'Your Name' }).fill(`anotheruser_${Date.now()}`);
    await page.getByRole('textbox', { name: 'Email' }).fill(existingUser.email);
    await page.getByRole('textbox', { name: 'Password' }).fill('ValidPass123!');
    await page.getByRole('button', { name: 'Sign up' }).click();

    // Then the registration should fail with an error displayed
    const errorMessage = page.locator('.error-messages');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/email.*(taken|already|has already been taken)/i);

    // And the user should not be logged in
    await expect(page).toHaveURL(/#\/register/);
    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();
    await expect(page.getByRole('link', { name: /login|sign in/i })).toBeVisible();
  });
});