import { test, expect } from '@playwright/test';
import { newUser, loginAs, UI } from '../support/fixtures';

test.describe('Article tags and editing', () => {
  test('Scenario: Article tags and editing (@item:H01)', async ({ page }) => {
    const user = await newUser();
    await loginAs(page, user);

    // Given a logged-in user is on the new article page
    await page.goto(`${UI}/#/editor`);

    const timestamp = Date.now();
    const initialTitle = `Article Tags Test ${timestamp}`;
    const initialDescription = 'Testing tags and editing';
    const initialBody = 'This is the initial body of the article with multiple tags.';
    const tags = ['tag-one', 'tag-two', 'tag-three'];

    // When the user publishes an article with a title, body, and three tags
    await page.getByPlaceholder('Article Title').fill(initialTitle);
    await page.getByPlaceholder("What's this article about?").fill(initialDescription);
    await page.getByPlaceholder('Write your article (in markdown)').fill(initialBody);

    const tagInput = page.getByPlaceholder('Enter tags');
    for (const tag of tags) {
      await tagInput.fill(tag);
      await tagInput.press('Enter');
    }

    await page.getByRole('button', { name: 'Publish Article' }).click();

    // Then the article page displays content matching the input
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(initialTitle);
    await expect(page.getByText(initialBody)).toBeVisible();
    for (const tag of tags) {
      await expect(page.locator('.tag-list').getByText(tag)).toBeVisible();
    }

    // When the user edits the article from the article page
    await page.getByRole('link', { name: /Edit Article/i }).first().click();
    await expect(page).toHaveURL(/#\/editor\//);

    // And changes the title to another string, removes all tags, and submits
    const updatedTitle = `Updated Article Title ${timestamp}`;
    const titleInput = page.getByPlaceholder('Article Title');
    await expect(titleInput).toHaveValue(initialTitle);
    await titleInput.fill(updatedTitle);

    // Remove all tags (clicking the remove icon on each tag badge)
    const removeTagIcons = page.locator('.tag-default i');
    while ((await removeTagIcons.count()) > 0) {
      await removeTagIcons.first().click();
    }

    await page.getByRole('button', { name: 'Publish Article' }).click();

    // Then the article page displays the updated title
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(updatedTitle);

    // And no tags appear on the article page
    await expect(page.locator('.tag-list li')).toHaveCount(0);
  });
});