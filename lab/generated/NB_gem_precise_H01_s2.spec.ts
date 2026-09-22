import { test, expect } from '@playwright/test';
import { newUser, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Criteria', () => {
  test('@item:H01 Article tags and editing', async ({ page }) => {
    const user = await newUser();
    await loginAs(page, user);

    // Given a logged-in user is on the new article page
    await page.goto(`${UI}/#/editor`);

    // When the user fills in a title and body, adds three tags, and publishes the article
    const originalTitle = `Title ${Date.now()}`;
    const description = 'Article Description';
    const body = 'Article Body Content';
    const tags = ['tag1', 'tag2', 'tag3'];

    await page.getByPlaceholder('Article Title').fill(originalTitle);
    await page.getByPlaceholder("What's this article about?").fill(description);
    await page.getByPlaceholder('Write your article (in markdown)').fill(body);

    const tagInput = page.getByPlaceholder('Enter tags');
    for (const tag of tags) {
      await tagInput.fill(tag);
      await tagInput.press('Enter');
    }

    await page.getByRole('button', { name: 'Publish Article' }).click();

    // Then the article page should display content matching the input
    await expect(page.getByRole('heading', { name: originalTitle, level: 1 })).toBeVisible();
    await expect(page.getByText(body)).toBeVisible();
    for (const tag of tags) {
      await expect(page.getByRole('list').getByText(tag, { exact: true })).toBeVisible();
    }

    // When the user edits the article from the article page
    await page.getByRole('link', { name: /Edit Article/i }).first().click();

    // And changes the title to another string, removes all tags, and submits
    const updatedTitle = `Updated Title ${Date.now()}`;
    await page.getByPlaceholder('Article Title').fill(updatedTitle);

    // Remove all tags
    const removeTagIcons = page.locator('.tag-list i.ion-close-round, .tag-list [class*="ion-close"], .tag-list button, .tag-default i');
    while (await removeTagIcons.count() > 0) {
      await removeTagIcons.first().click();
    }

    await page.getByRole('button', { name: /Publish Article|Update Article/i }).click();

    // Then the updated title should be displayed
    await expect(page.getByRole('heading', { name: updatedTitle, level: 1 })).toBeVisible();

    // And the tags should no longer appear
    for (const tag of tags) {
      await expect(page.locator('.tag-list').getByText(tag, { exact: true })).not.toBeVisible();
    }
  });
});