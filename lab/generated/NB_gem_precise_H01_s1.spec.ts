import { test, expect } from '@playwright/test';
import { newUser, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('Article tags and editing', async ({ page }) => {
    const user = await newUser();
    await loginAs(page, user);

    // Given I am a logged-in user on the new article page
    await page.goto(`${UI}/#/editor`);

    const title = `Article Title ${Date.now()}`;
    const description = 'Article Description';
    const body = 'Article Body Content';
    const tags = ['tag-one', 'tag-two', 'tag-three'];

    // When I publish an article with a title, body, and three tags
    await page.locator('input[placeholder="Article Title"]').fill(title);
    await page.locator('input[placeholder*="about"]').fill(description);
    await page.locator('textarea[placeholder*="markdown"]').fill(body);

    const tagInput = page.locator('input[placeholder*="tags"]');
    for (const tag of tags) {
      await tagInput.fill(tag);
      await tagInput.press('Enter');
    }

    await page.locator('button:has-text("Publish Article")').click();

    // Then the article page shows content matching what was entered
    await expect(page.locator('h1')).toHaveText(title);
    await expect(page.locator('.article-content')).toContainText(body);
    for (const tag of tags) {
      await expect(page.locator('.tag-list')).toContainText(tag);
    }

    // When I choose to edit the article on its page
    await page.locator('a:has-text("Edit Article")').first().click();

    // And I change the title to a different string, remove all tags, and submit
    const updatedTitle = `Updated Title ${Date.now()}`;
    const titleInput = page.locator('input[placeholder="Article Title"]');
    await titleInput.fill('');
    await titleInput.fill(updatedTitle);

    // Remove all tags
    const removeTagIcons = page.locator('.tag-default i, .tag-pill i');
    while (await removeTagIcons.count() > 0) {
      await removeTagIcons.first().click();
    }

    await page.locator('button:has-text("Publish Article")').click();

    // Then the article title is updated
    await expect(page.locator('h1')).toHaveText(updatedTitle);

    // And the tags no longer appear
    for (const tag of tags) {
      await expect(page.locator('.tag-list')).not.toContainText(tag);
    }
  });
});