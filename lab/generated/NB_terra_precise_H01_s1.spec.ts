import { test, expect } from '@playwright/test';
import { newUser, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('H01 - Article tags and editing', async ({ page }) => {
    const user = await newUser();
    const originalTitle = `Article title ${Date.now()}`;
    const updatedTitle = `Updated article title ${Date.now()}`;
    const body = 'This is the article body.';
    const tags = ['playwright', 'typescript', 'conduit'];

    await loginAs(page, user);
    await page.goto(`${UI}/#/editor`);

    await page.getByPlaceholder('Article Title').fill(originalTitle);
    await page.getByPlaceholder("What's this article about?").fill('Article description');
    await page.getByPlaceholder('Write your article (in markdown)').fill(body);

    const tagInput = page.getByPlaceholder('Enter tags');
    for (const tag of tags) {
      await tagInput.fill(tag);
      await tagInput.press('Enter');
    }

    await page.getByRole('button', { name: 'Publish Article' }).click();

    await expect(page).toHaveURL(/#\/article\//);
    await expect(page.getByRole('heading', { name: originalTitle })).toBeVisible();
    await expect(page.locator('.article-content')).toContainText(body);

    for (const tag of tags) {
      await expect(page.locator('.tag-list')).toContainText(tag);
    }

    await page.getByRole('button', { name: 'Edit Article' }).click();

    await expect(page).toHaveURL(/#\/editor\//);
    await page.getByPlaceholder('Article Title').fill(updatedTitle);

    const tagPills = page.locator('.tag-list .tag-pill');
    while (await tagPills.count()) {
      await tagPills.first().locator('i').click();
    }

    await page.getByRole('button', { name: 'Publish Article' }).click();

    await expect(page).toHaveURL(/#\/article\//);
    await expect(page.getByRole('heading', { name: updatedTitle })).toBeVisible();

    for (const tag of tags) {
      await expect(page.locator('.tag-list')).not.toContainText(tag);
    }
  });
});