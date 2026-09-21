import { test, expect } from '@playwright/test';
import { newUser, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('@item:H01 Article tags and editing', async ({ page }) => {
    const user = await newUser();
    const title = `Original article ${Date.now()}`;
    const updatedTitle = `Updated article ${Date.now()}`;
    const body = 'This is the original article body.';
    const tags = ['playwright', 'acceptance', 'editing'];

    await loginAs(page, user);
    await page.goto(`${UI}/#/editor`);

    await page.getByPlaceholder('Article Title').fill(title);
    await page.getByPlaceholder("What's this article about?").fill('Article description');
    await page.getByPlaceholder('Write your article (in markdown)').fill(body);

    const tagInput = page.getByPlaceholder('Enter tags');
    for (const tag of tags) {
      await tagInput.fill(tag);
      await tagInput.press('Enter');
    }

    await page.getByRole('button', { name: 'Publish Article' }).click();

    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await expect(page.getByText(body)).toBeVisible();

    for (const tag of tags) {
      await expect(page.getByText(tag, { exact: true })).toBeVisible();
    }

    await page.getByRole('button', { name: 'Edit Article' }).click();

    await page.getByPlaceholder('Article Title').fill(updatedTitle);

    const removeTagButtons = page.locator('.tag-list i');
    while (await removeTagButtons.count()) {
      await removeTagButtons.first().click();
    }

    await page.getByRole('button', { name: 'Publish Article' }).click();

    await expect(page.getByRole('heading', { name: updatedTitle })).toBeVisible();

    for (const tag of tags) {
      await expect(page.getByText(tag, { exact: true })).toHaveCount(0);
    }
  });
});