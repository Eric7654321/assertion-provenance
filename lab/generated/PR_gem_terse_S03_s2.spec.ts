import { test, expect } from '@playwright/test';
import { newUser, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Requirements', () => {
  test('S03 Login with incorrect password', async ({ page }) => {
    // Given the user is on the login page
    const user = await newUser();
    await page.goto(`${UI}/#/login`);

    // When the user enters a registered email and an incorrect password and submits
    await page.getByRole('textbox', { name: 'Email' }).fill(user.email);
    await page.getByRole('textbox', { name: 'Password' }).fill('wrong-password-12345');
    await page.getByRole('button', { name: 'Login' }).click();

    // Then login should not succeed
    await expect(page).toHaveURL(`${UI}/#/login`);

    // And the screen should notify the user
    const errorMessages = page.locator('.error-messages');
    await expect(errorMessages).toBeVisible();
    await expect(errorMessages).not.toBeEmpty();
  });
});