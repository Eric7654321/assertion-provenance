import { test, expect } from '@playwright/test';
import { newUser, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Criteria', () => {
  test('Registration with duplicate email', async ({ page }) => {
    // Given a user has registered with an unused email
    const existingUser = await newUser();

    // And has logged out (new page context starts logged out)
    await page.goto(`${UI}/#/register`);

    // When the user attempts to register again with the same email
    await page.locator('input[placeholder="Username"]').fill(`user_${Date.now()}`);
    await page.locator('input[placeholder="Email"]').fill(existingUser.email);
    await page.locator('input[placeholder="Password"]').fill('Password123!');
    await page.locator('button[type="submit"], button:has-text("Sign up")').click();

    // Then the registration should fail with an error displayed
    const errorMessage = page.locator('.error-messages');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/email/i);

    // And the user should not be logged in
    await expect(page).toHaveURL(/#\/register/);
    await expect(page.locator('a[href="#/login"], a:has-text("Sign in")')).toBeVisible();
    await expect(page.locator('a[href="#/register"], a:has-text("Sign up")')).toBeVisible();
  });
});