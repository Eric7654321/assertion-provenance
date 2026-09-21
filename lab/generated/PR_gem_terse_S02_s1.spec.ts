import { test, expect } from '@playwright/test';
import { newUser, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Requirements', () => {
  test('Registration with a duplicate email', async ({ page }) => {
    // Given a user completes registration with an unused email
    const existingUser = await newUser();

    // And the user logs out (User is already created via API and not logged into this browser session)
    // When the user attempts to register again with the same email
    await page.goto(`${UI}/#/register`);

    await page.getByRole('textbox', { name: 'Your Name' }).fill(`newuser_${Date.now()}`);
    await page.getByRole('textbox', { name: 'Email' }).fill(existingUser.email);
    await page.getByRole('textbox', { name: 'Password' }).fill('password123');
    await page.getByRole('button', { name: 'Sign up' }).click();

    // Then the second registration should not succeed
    // Verify that an error message appears and the URL does not transition away from register
    await expect(page.locator('.error-messages')).toBeVisible();
    await expect(page).toHaveURL(/#\/register/);
  });
});