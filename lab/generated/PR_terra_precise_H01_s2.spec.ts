import { test, expect } from '@playwright/test';
import { newUser, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Criteria', () => {
  test('@item:H01 Article tags and editing', async ({ page }) => {
    const user = await newUser();
    const originalTitle = `Article title ${Date.now()}`;
    const updatedTitle = `Updated article title ${Date.now()}`;
    const body = 'This is the article body created by the acceptance test.';
    const tags = ['playwright', 'acceptance', 'editing'];

    await loginAs(page, user);
    await page.goto(`${UI}/#/editor`);

    await page.getByPlaceholder('Article Title').fill(originalTitle);
    await page.getByPlaceholder("What's this article about?").fill(
      'An article created by Playwright',
    );
    await page.getByPlaceholder('Write your article (in markdown)').fill(body);

    const tagInput = page.getByPlaceholder('Enter tags');
    for (const tag of tags) {
      await tagInput.fill(tag);
      await tagInput.press('Enter');
    }

    await page.getByRole('button', { name: 'Publish Article' }).click();

    await expect(page.getByRole('heading', { name: originalTitle })).toBeVisible();
    await expect(page.locator('.article-content')).toContainText(body);

    for (const tag of tags) {
      await expect(page.getByText(tag, { exact: true })).toBeVisible();
    }

    await page.getByRole('button', { name: 'Edit Article' }).click();

    await page.getByPlaceholder('Article Title').fill(updatedTitle);

    const removeTagButtons = page.locator('.tag-list button');
    while ((await removeTagButtons.count()) > 0) {
      await removeTagButtons.first().click();
    }

    await page.getByRole('button', { name: 'Publish Article' }).click();

    await expect(page.getByRole('heading', { name: updatedTitle })).toBeVisible();

    for (const tag of tags) {
      await expect(page.getByText(tag, { exact: true })).toHaveCount(0);
    }
  });
});