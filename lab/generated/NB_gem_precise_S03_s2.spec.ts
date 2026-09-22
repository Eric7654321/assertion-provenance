import { test, expect } from '@playwright/test';
import { newUser, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Criteria', () => {
  test('@item:S03 Login with incorrect password', async ({ page }) => {
    // 建立一筆已註冊的使用者
    const user = await newUser();

    // Given a user is on the login page
    await page.goto(`${UI}/#/login`);

    // When the user enters a registered email and an incorrect password, and submits
    await page.getByPlaceholder('Email').fill(user.email);
    await page.getByPlaceholder('Password').fill('incorrect-password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Then the user should remain on the login page
    await expect(page).toHaveURL(/#\/login/);

    // And an error message should be displayed
    const errorMessage = page.locator('.error-messages');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).not.toBeEmpty();
  });
});