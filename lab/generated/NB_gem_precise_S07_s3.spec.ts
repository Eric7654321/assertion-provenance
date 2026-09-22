import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('@item:S07 Scenario: Author deletes own article', async ({ page }) => {
    // Given an author opens their own article page
    const author = await newUser();
    const article = await newArticle(author);

    await loginAs(page, author);
    await page.goto(`${UI}/#/article/${article.slug}`);

    // When the author deletes the article
    // Wait for the delete button to be available and click it
    // Conduit standard usually has a button with text "Delete Article" or similar
    const deleteButton = page.getByRole('button', { name: /delete article/i }).first();
    await expect(deleteButton).toBeVisible();

    // Sometimes a confirm dialog might appear; accept if dialog pops up
    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });

    await deleteButton.click();

    // Then the article no longer appears in the article list on the home page
    // After deletion, the application should redirect to the home page
    await page.waitForURL(`${UI}/#/`);

    // Verify on home page (under Global Feed or Your Feed) that the article title does not appear
    // Switch to Global Feed tab if needed, or check the article list
    const globalFeedTab = page.getByRole('button', { name: /global feed/i }).or(page.getByText('Global Feed'));
    if (await globalFeedTab.isVisible()) {
      await globalFeedTab.click();
    }

    await expect(page.getByRole('heading', { name: article.title })).not.toBeVisible();
    await expect(page.getByText(article.title)).not.toBeVisible();
  });
});