import { test, expect } from '@playwright/test';
import { newUser, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('Registration with duplicate email', async ({ page }) => {
    // Given a user completes registration with an unused email
    // And the user logs out
    const existingUser = await newUser();

    // When the user registers again with the same email
    await page.goto(`${UI}/#/register`);

    await page.getByRole('textbox', { name: 'Your Name' }).fill('differentuser');
    await page.getByRole('textbox', { name: 'Email' }).fill(existingUser.email);
    await page.getByRole('textbox', { name: 'Password' }).fill('anotherpassword123');
    await page.getByRole('button', { name: 'Sign up' }).click();

    // Then the second registration is not successful
    // The page URL should still remain on register (or not redirect to home)
    // and an error message should be displayed indicating the email is taken
    await expect(page).toHaveURL(/.*#\/register/);
    await expect(page.locator('.error-messages, [role="alert"]')).toBeVisible();
    await expect(page.locator('.error-messages, [role="alert"]')).toContainText(/email.*has already been taken|email.*taken|already taken/i);
  });
});