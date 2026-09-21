import { test, expect } from '@playwright/test';
import { newUser, loginAs, UI } from '../support/fixtures';

test.describe('Article tags and editing', () => {
  test('Scenario: Article tags and editing', async ({ page }) => {
    const user = await newUser();
    await loginAs(page, user);

    // Given I am a logged-in user on the new article page
    await page.goto(`${UI}/#/editor`);

    // When I publish an article with a title, body, and three tags
    const initialTitle = `Article ${Date.now()}`;
    const initialDescription = 'About this article';
    const initialBody = 'This is the article body content.';
    const tags = ['tag-one', 'tag-two', 'tag-three'];

    await page.getByPlaceholder('Article Title').fill(initialTitle);
    await page.getByPlaceholder("What's this article about?").fill(initialDescription);
    await page.getByPlaceholder('Write your article (in markdown)').fill(initialBody);

    const tagInput = page.getByPlaceholder('Enter tags');
    for (const tag of tags) {
      await tagInput.fill(tag);
      await tagInput.press('Enter');
    }

    await page.getByRole('button', { name: 'Publish Article' }).click();

    // Then the article page shows content matching what was entered
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(initialTitle);
    await expect(page.getByText(initialBody)).toBeVisible();
    for (const tag of tags) {
      await expect(page.locator('.tag-list, .tag-default').filter({ hasText: tag }).first()).toBeVisible();
    }

    // When I choose to edit the article on its page
    await page.getByRole('link', { name: /Edit Article/i }).first().click();

    // And I change the title to a different string, remove all tags, and submit
    const updatedTitle = `Updated Article ${Date.now()}`;
    const titleInput = page.getByPlaceholder('Article Title');
    await expect(titleInput).toBeVisible();
    await titleInput.fill(updatedTitle);

    // Remove all tags
    const removeTagIcons = page.locator('.tag-default i, .tag-pill i, .ti-close, [data-testid="remove-tag"], .ion-close-round');
    while (await removeTagIcons.count() > 0) {
      await removeTagIcons.first().click();
    }

    await page.getByRole('button', { name: /Publish Article|Update Article/i }).click();

    // Then the article title is updated
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(updatedTitle);

    // And the tags no longer appear
    for (const tag of tags) {
      await expect(page.locator('.tag-list').getByText(tag)).toHaveCount(0);
    }
  });
});