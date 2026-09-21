import { test, expect } from '@playwright/test';
import { newUser, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Requirements', () => {
  test('@item:H01 Article tagging and editing', async ({ page }) => {
    const user = await newUser();
    await loginAs(page, user);

    // Given a user is logged in
    // And the user goes to the new article page
    await page.goto(`${UI}/#/editor`);

    const title1 = `Tag Test Title ${Date.now()}`;
    const description1 = 'Article description';
    const body1 = 'This is the article body text with tags.';
    const tags = ['tag-one', 'tag-two', 'tag-three'];

    // When the user fills in the title and body, adds three tags, and publishes the article
    await page.getByRole('textbox', { name: 'Article Title' }).fill(title1);
    await page.getByRole('textbox', { name: "What's this article about?" }).fill(description1);
    await page.getByRole('textbox', { name: 'Write your article (in markdown)' }).fill(body1);

    const tagInput = page.getByRole('textbox', { name: 'Enter tags' });
    for (const tag of tags) {
      await tagInput.fill(tag);
      await tagInput.press('Enter');
    }

    await page.getByRole('button', { name: 'Publish Article' }).click();

    // Then the article page content should match the entered information
    await expect(page.locator('h1')).toHaveText(title1);
    await expect(page.getByText(body1)).toBeVisible();
    for (const tag of tags) {
      await expect(page.locator('.tag-list').getByText(tag)).toBeVisible();
    }

    // When the user clicks edit on the article page
    await page.getByRole('link', { name: /Edit Article/i }).first().click();

    // And the user changes the title to a different string, removes all tags, and submits
    const title2 = `Updated Title ${Date.now()}`;
    const titleInput = page.getByRole('textbox', { name: 'Article Title' });
    await expect(titleInput).toHaveValue(title1);
    await titleInput.fill(title2);

    // Remove all tags in editor
    const removeTagButtons = page.locator('.tag-list i, .tag-default i, [class*="ion-close"], [class*="ion-trash"]');
    while ((await removeTagButtons.count()) > 0) {
      await removeTagButtons.first().click();
    }

    await page.getByRole('button', { name: 'Publish Article' }).click();

    // Then the article page should update accordingly
    await expect(page.locator('h1')).toHaveText(title2);
    for (const tag of tags) {
      await expect(page.locator('.tag-list').getByText(tag)).toBeHidden();
    }
  });
});