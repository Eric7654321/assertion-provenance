import { test, expect } from '@playwright/test';
import { newUser, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('Login with incorrect password', async ({ page }) => {
    // Given I am on the login page
    const user = await newUser();
    await page.goto(`${UI}/#/login`);

    // When I submit a registered email with an incorrect password
    await page.getByPlaceholder('Email').fill(user.email);
    await page.getByPlaceholder('Password').fill('incorrect-password-12345');
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Then I remain on the login page
    await expect(page).toHaveURL(`${UI}/#/login`);

    // And an error message is displayed
    const errorMessages = page.locator('.error-messages');
    await expect(errorMessages).toBeVisible();
    await expect(errorMessages).not.toBeEmpty();
  });
});