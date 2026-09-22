import { test, expect } from '@playwright/test';
import { newUser, apiCall, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('@item:S02 Registration with duplicate email', async ({ page }) => {
    const user = await newUser();

    await page.goto(`${UI}/#/register`);

    await page.getByPlaceholder('Username').fill(`${user.username}-duplicate`);
    await page.getByPlaceholder('Email').fill(user.email);
    await page.getByPlaceholder('Password').fill('password123');

    await page.getByRole('button', { name: 'Sign up' }).click();

    await expect(page.locator('.error-messages')).toBeVisible();
    await expect(page.locator('.error-messages')).toContainText(/email.*already|already.*email/i);

    await expect(page).toHaveURL(/#\/register$/);
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();

    const currentUser = await apiCall('/user', 'GET');
    expect(currentUser.status).toBe(401);
  });
});