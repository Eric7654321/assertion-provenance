import { test, expect } from '@playwright/test';
import { newUser, apiCall, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Requirements', () => {
  test('S02: registration with a duplicate email does not succeed', async ({ page }) => {
    const user = await newUser();

    await page.goto(`${UI}/#/register`);

    await page.getByPlaceholder('Username').fill(user.username);
    await page.getByPlaceholder('Email').fill(user.email);
    await page.getByPlaceholder('Password').fill(user.password);
    await page.getByRole('button', { name: /sign up/i }).click();

    await expect(page).toHaveURL(/#\/$/);

    await page.getByRole('link', { name: /settings/i }).click();
    await expect(page).toHaveURL(/#\/settings/);

    await page.getByRole('button', { name: /or click here to logout/i }).click();
    await expect(page).toHaveURL(/#\/$/);

    const duplicateRegistration = await apiCall('/users', 'POST', {
      user: {
        username: `${user.username}-duplicate`,
        email: user.email,
        password: user.password,
      },
    });

    expect(duplicateRegistration.status).toBeGreaterThanOrEqual(400);
    expect(duplicateRegistration.json).toHaveProperty('errors');

    await page.goto(`${UI}/#/register`);
    await page.getByPlaceholder('Username').fill(`${user.username}-duplicate`);
    await page.getByPlaceholder('Email').fill(user.email);
    await page.getByPlaceholder('Password').fill(user.password);
    await page.getByRole('button', { name: /sign up/i }).click();

    await expect(page).toHaveURL(/#\/register/);
    await expect(page.getByText(/email.*has already been taken/i)).toBeVisible();
  });
});