import { test, expect } from '@playwright/test';
import { newUser, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('Article tagging and editing @item:H01', async ({ page }) => {
    const user = await newUser();
    await loginAs(page, user);

    const originalTitle = `Title-${Date.now()}`;
    const originalAbout = 'Article description';
    const originalBody = 'This is the article body content in markdown.';
    const tags = ['tag1', 'tag2', 'tag3'];

    // Given a logged-in user is on the new article page
    await page.goto(`${UI}/#/editor`);

    // When the user fills in the title and body, adds three tags, and publishes the article
    await page.getByPlaceholder('Article Title').fill(originalTitle);
    await page.getByPlaceholder("What's this article about?").fill(originalAbout);
    await page.getByPlaceholder('Write your article (in markdown)').fill(originalBody);

    const tagInput = page.getByPlaceholder('Enter tags');
    for (const tag of tags) {
      await tagInput.fill(tag);
      await tagInput.press('Enter');
    }

    await page.getByRole('button', { name: 'Publish Article' }).click();

    // Then the article page content matches the input
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(originalTitle);
    await expect(page.getByText(originalBody)).toBeVisible();
    for (const tag of tags) {
      await expect(page.getByRole('listitem').filter({ hasText: tag })).toBeVisible();
    }

    // When the user clicks edit on the article page
    await page.getByRole('link', { name: 'Edit Article' }).first().click();

    // And the user changes the title to another string, removes all tags, and submits
    await expect(page.getByPlaceholder('Article Title')).toHaveValue(originalTitle);

    const updatedTitle = `Updated-Title-${Date.now()}`;
    await page.getByPlaceholder('Article Title').fill(updatedTitle);

    // Remove all tags (clicking the remove icon or close button on tag pills)
    const removeTagButtons = page.locator('.tag-default i, .tag-pill i, [data-testid="remove-tag"]');
    while ((await removeTagButtons.count()) > 0) {
      await removeTagButtons.first().click();
    }

    await page.getByRole('button', { name: 'Publish Article' }).click();

    // Then the article page is updated accordingly
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(updatedTitle);
    for (const tag of tags) {
      await expect(page.locator('.tag-list').getByText(tag)).toHaveCount(0);
    }
  });
});