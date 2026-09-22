import { test, expect } from '@playwright/test';
import { newUser, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('Article tags and editing', async ({ page }) => {
    // Given a logged-in user is on the new article page
    const user = await newUser();
    await loginAs(page, user);

    await page.goto(`${UI}/#/editor`);
    await expect(page.locator('input[placeholder="Article Title"]')).toBeVisible();

    // When the user publishes an article with a title, body, and three tags
    const initialTitle = `Article Title ${Date.now()}`;
    const initialDescription = 'Article description test';
    const initialBody = 'This is the initial body content of the test article.';
    const tags = ['tag1', 'tag2', 'tag3'];

    await page.locator('input[placeholder="Article Title"]').fill(initialTitle);
    await page.locator('input[placeholder="What\'s this article about?"]').fill(initialDescription);
    await page.locator('textarea[placeholder="Write your article (in markdown)"]').fill(initialBody);

    const tagInput = page.locator('input[placeholder="Enter tags"]');
    for (const tag of tags) {
      await tagInput.fill(tag);
      await tagInput.press('Enter');
    }

    const publishButton = page.locator('button', { hasText: /Publish Article/i });
    await publishButton.click();

    // Then the article page displays content matching the input
    await expect(page.locator('h1')).toHaveText(initialTitle);
    await expect(page.locator('.article-content')).toContainText(initialBody);
    for (const tag of tags) {
      await expect(page.locator('.tag-list')).toContainText(tag);
    }

    // When the user edits the article from the article page
    const editArticleButton = page.getByRole('link', { name: /Edit Article/i }).first();
    await editArticleButton.click();

    await expect(page.locator('input[placeholder="Article Title"]')).toBeVisible();

    // And changes the title to another string, removes all tags, and submits
    const updatedTitle = `Updated Title ${Date.now()}`;
    await page.locator('input[placeholder="Article Title"]').fill(updatedTitle);

    // Remove all tags in editor
    const tagRemoveIcons = page.locator('.tag-list .tag-default i, .tag-list .tag-pill i');
    while (await tagRemoveIcons.count() > 0) {
      await tagRemoveIcons.first().click();
    }

    const submitEditButton = page.locator('button[type="submit"], button:has-text("Publish Article"), button:has-text("Update Article")').first();
    await submitEditButton.click();

    // Then the article page displays the updated title
    await expect(page.locator('h1')).toHaveText(updatedTitle);

    // And no tags appear on the article page
    await expect(page.locator('.tag-list .tag-pill, .tag-list .tag-default')).toHaveCount(0);
  });
});