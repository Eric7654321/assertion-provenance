import { test, expect } from '@playwright/test';
import { newUser, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Criteria', () => {
  test('Login with incorrect password', async ({ page }) => {
    // Given a user is on the login page
    const user = await newUser();
    await page.goto(`${UI}/#/login`);

    // When the user enters a registered email and an incorrect password, and submits
    await page.getByRole('textbox', { name: 'Email' }).fill(user.email);
    await page.getByRole('textbox', { name: 'Password' }).fill('wrong-password');
    await page.getByRole('button', { name: 'Login' }).click();

    // Then the user should remain on the login page
    await expect(page).toHaveURL(`${UI}/#/login`);

    // And an error message should be displayed
    const errorMessage = page.locator('.error-messages');
    await expect(errorMessage).toBeVisible();
  });
});