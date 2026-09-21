import { test, expect } from '@playwright/test';
import { newUser, UI } from '../support/fixtures';

test.describe('Feature: Conduit Acceptance Tests', () => {
  test('@item:S03 Scenario: Login with incorrect password', async ({ page }) => {
    // Given a registered user
    const user = await newUser();

    // Given I am on the login page
    await page.goto(`${UI}/#/login`);

    // When I submit a registered email with an incorrect password
    await page.getByRole('textbox', { name: 'Email' }).fill(user.email);
    await page.getByRole('textbox', { name: 'Password' }).fill('wrong-password-12345');
    await page.getByRole('button', { name: 'Login' }).click();

    // Then I remain on the login page
    await expect(page).toHaveURL(`${UI}/#/login`);

    // And an error message is displayed
    const errorMessage = page.locator('.error-messages');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).not.toBeEmpty();
  });
});