import { test, expect } from '@playwright/test';
import { newUser, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('Registration with duplicate email', async ({ page }) => {
    // Given a user completes registration with an unused email
    // And logs out
    const existingUser = await newUser();

    // When the user registers again with the same email
    await page.goto(`${UI}/#/register`);

    // Use a different username to isolate email conflict
    const newUsername = `user_${Date.now()}`;
    await page.fill('input[placeholder="Username"]', newUsername);
    await page.fill('input[placeholder="Email"]', existingUser.email);
    await page.fill('input[placeholder="Password"]', 'ValidPassword123!');
    await page.click('button[type="submit"]');

    // Then the registration fails with an error displayed
    const errorMessages = page.locator('.error-messages');
    await expect(errorMessages).toBeVisible();
    await expect(errorMessages).toContainText('email has already been taken');

    // And the user is not logged in
    await expect(page).toHaveURL(/#\/register/);
    await expect(page.locator('a[href="#/login"]')).toBeVisible();
    await expect(page.locator('a[href="#/register"]')).toBeVisible();
    await expect(page.locator(`a[href="#/@${newUsername}"]`)).not.toBeVisible();
  });
});