import { test, expect } from '@playwright/test';
import { newUser, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Criteria', () => {
  test('@item:H01 Article tags and editing', async ({ page }) => {
    const user = await newUser();
    await loginAs(page, user);

    // Given a logged-in user is on the new article page
    await page.goto(`${UI}/#/editor`);

    const titleInput = page.getByPlaceholder('Article Title');
    const descriptionInput = page.getByPlaceholder("What's this article about?");
    const bodyInput = page.getByPlaceholder('Write your article (in markdown)');
    const tagInput = page.getByPlaceholder('Enter tags');
    const publishButton = page.getByRole('button', { name: 'Publish Article' });

    const initialTitle = `Article-${Date.now()}`;
    const initialBody = 'This is the initial body content of the article.';
    const tags = ['tag1', 'tag2', 'tag3'];

    // When the user fills in a title and body, adds three tags, and publishes the article
    await titleInput.fill(initialTitle);
    await descriptionInput.fill('Initial summary');
    await bodyInput.fill(initialBody);

    for (const tag of tags) {
      await tagInput.fill(tag);
      await tagInput.press('Enter');
    }

    await publishButton.click();

    // Then the article page should display content matching the input
    await expect(page.locator('h1')).toHaveText(initialTitle);
    await expect(page.getByText(initialBody)).toBeVisible();
    for (const tag of tags) {
      await expect(page.locator('.tag-list').getByText(tag)).toBeVisible();
    }

    // When the user edits the article from the article page
    await page.getByRole('link', { name: /Edit Article/i }).first().click();
    await expect(page).toHaveURL(/#\/editor\/.+/);

    // And changes the title to another string, removes all tags, and submits
    const updatedTitle = `Updated-${Date.now()}`;
    await titleInput.fill(updatedTitle);

    // Remove all tags in editor
    const removeTagIcons = page.locator('.tag-list .ion-close-round, .tag-list .ion-trash-a, .tag-list [class*="close"], .tag-list i');
    while (await removeTagIcons.count() > 0) {
      await removeTagIcons.first().click();
    }

    await publishButton.click();

    // Then the updated title should be displayed
    await expect(page.locator('h1')).toHaveText(updatedTitle);

    // And the tags should no longer appear
    for (const tag of tags) {
      await expect(page.locator('.tag-list').getByText(tag)).toHaveCount(0);
    }
  });
});