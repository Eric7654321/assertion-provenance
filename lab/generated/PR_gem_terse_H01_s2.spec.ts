import { test, expect } from '@playwright/test';
import { newUser, loginAs, UI } from '../support/fixtures';

test.describe('Article tagging and editing', () => {
  test('H01: Article tagging and editing', async ({ page }) => {
    // Given a user is logged in
    const user = await newUser();
    await loginAs(page, user);

    // And the user is on the new article page
    await page.goto(`${UI}/#/editor`);

    // When the user enters a title, body, and adds three tags, and publishes the article
    const originalTitle = `Test Article ${Date.now()}`;
    const originalBody = 'This is the article body content for testing tags and editing.';
    const tags = ['tag-one', 'tag-two', 'tag-three'];

    await page.getByPlaceholder('Article Title').fill(originalTitle);
    await page.getByPlaceholder("What's this article about?").fill('Article summary');
    await page.getByPlaceholder('Write your article (in markdown)').fill(originalBody);

    const tagInput = page.getByPlaceholder('Enter tags');
    for (const tag of tags) {
      await tagInput.fill(tag);
      await tagInput.press('Enter');
    }

    await page.getByRole('button', { name: 'Publish Article' }).click();

    // Then the article page content should match the entered information
    await expect(page.locator('h1')).toHaveText(originalTitle);
    await expect(page.getByText(originalBody)).toBeVisible();
    for (const tag of tags) {
      await expect(page.locator('.tag-list').getByText(tag)).toBeVisible();
    }

    // When the user selects edit on the article page
    await page.getByRole('link', { name: /Edit Article/ }).first().click();
    await expect(page).toHaveURL(new RegExp(`${UI}/#/editor/`));

    // And the user changes the title to a different string, removes all tags, and submits
    const updatedTitle = `Updated Article ${Date.now()}`;
    await page.getByPlaceholder('Article Title').fill(updatedTitle);

    // Remove all tags (clicking the remove icon on each tag pill)
    const removeTagButtons = page.locator('.tag-list i, .tag-default i, .tag-pill i');
    while (await removeTagButtons.count() > 0) {
      await removeTagButtons.first().click();
    }

    await page.getByRole('button', { name: 'Publish Article' }).click();

    // Then the article page should update accordingly
    await expect(page.locator('h1')).toHaveText(updatedTitle);
    for (const tag of tags) {
      await expect(page.locator('.tag-list').getByText(tag)).not.toBeVisible();
    }
  });
});