import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Requirements', () => {
  test('Author deletes own article', async ({ page }) => {
    // Given the author opens their own article page
    const user = await newUser();
    const article = await newArticle(user);

    await loginAs(page, user);
    await page.goto(`${UI}/#/article/${article.slug}`);

    // When the author clicks delete article
    const deleteButton = page.getByRole('button', { name: /Delete Article/ }).first();
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();

    // Then the article should disappear from the list
    // Usually deleting an article redirects to home /#/ or author profile
    await page.waitForURL(`${UI}/#/`);

    // Verify the article title is not in the list
    await expect(page.getByText(article.title)).not.toBeVisible();
  });
});