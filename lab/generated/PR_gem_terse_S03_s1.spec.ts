import { test, expect } from '@playwright/test';
import { newUser, UI } from '../support/fixtures';

test.describe('Feature: Conduit Acceptance Requirements', () => {
  test('@item:S03 Scenario: Login with incorrect password', async ({ page }) => {
    // Given a user enters a registered email and an incorrect password on the login page
    const user = await newUser();

    await page.goto(`${UI}/#/login`);

    await page.getByRole('textbox', { name: 'Email' }).fill(user.email);
    await page.getByRole('textbox', { name: 'Password' }).fill('IncorrectPassword123!');

    // When the user submits the form
    await page.getByRole('button', { name: 'Login' }).click();

    // Then the login should not succeed and the page should inform the user
    await expect(page).toHaveURL(`${UI}/#/login`);
    const errorMessages = page.locator('.error-messages');
    await expect(errorMessages).toBeVisible();
    await expect(errorMessages).not.toBeEmpty();
  });
});