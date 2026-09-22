import { test, expect } from '@playwright/test';
import { newUser, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('@item:H01 Article tags and editing', async ({ page }) => {
    const user = await newUser();

    const originalTitle = `Article with tags ${Date.now()}`;
    const updatedTitle = `Updated article title ${Date.now()}`;
    const body = 'This is the article body used to verify publishing and editing.';
    const tags = ['playwright', 'typescript', 'acceptance'];

    await loginAs(page, user);
    await page.goto(`${UI}/#/editor`);

    await page.getByPlaceholder('Article Title').fill(originalTitle);
    await page.getByPlaceholder("What's this article about?").fill('A test article');
    await page.getByPlaceholder('Write your article (in markdown)').fill(body);

    const tagInput = page.getByPlaceholder('Enter tags');
    for (const tag of tags) {
      await tagInput.fill(tag);
      await tagInput.press('Enter');
    }

    await page.getByRole('button', { name: 'Publish Article' }).click();

    await expect(page).toHaveURL(/#\/article\//);
    await expect(page.getByRole('heading', { name: originalTitle })).toBeVisible();
    await expect(page.getByText(body)).toBeVisible();

    for (const tag of tags) {
      await expect(page.getByText(tag, { exact: true })).toBeVisible();
    }

    await page.getByRole('link', { name: 'Edit Article' }).click();

    await expect(page).toHaveURL(/#\/editor\//);
    await page.getByPlaceholder('Article Title').fill(updatedTitle);

    const removeTagButtons = page.locator('.tag-list i');
    while (await removeTagButtons.count()) {
      await removeTagButtons.first().click();
    }

    await page.getByRole('button', { name: 'Publish Article' }).click();

    await expect(page).toHaveURL(/#\/article\//);
    await expect(page.getByRole('heading', { name: updatedTitle })).toBeVisible();

    for (const tag of tags) {
      await expect(page.getByText(tag, { exact: true })).not.toBeVisible();
    }
  });
});