import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Criteria', () => {
  test('@item:S07 Author deletes own article', async ({ page }) => {
    // Given an author opens their own article page
    const author = await newUser();
    const article = await newArticle(author);

    await loginAs(page, author);
    await page.goto(`${UI}/#/article/${article.slug}`);

    // When the author deletes the article
    await page.getByRole('button', { name: 'Delete Article' }).first().click();

    // Then the article should no longer appear in the article list on the home page
    await expect(page).toHaveURL(`${UI}/#/`);

    // Ensure we are viewing Global Feed if available, or check the article is absent
    const globalFeedTab = page.getByRole('button', { name: 'Global Feed' });
    if (await globalFeedTab.isVisible()) {
      await globalFeedTab.click();
    }

    await expect(page.getByText(article.title)).not.toBeVisible();
  });
});