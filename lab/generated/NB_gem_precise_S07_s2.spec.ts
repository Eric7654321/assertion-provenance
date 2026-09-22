import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Criteria', () => {
  test('Author deletes own article (@item:S07)', async ({ page }) => {
    // Given an author opens their own article page
    const author = await newUser();
    const article = await newArticle(author);

    await loginAs(page, author);
    await page.goto(`${UI}/#/article/${article.slug}`);

    await expect(page.getByRole('heading', { name: article.title })).toBeVisible();

    // 處理可能出現的確認彈窗 (window.confirm)
    page.on('dialog', dialog => dialog.accept());

    // When the author deletes the article
    const deleteButton = page.getByRole('button', { name: /delete article/i }).first();
    await deleteButton.click();

    // 刪除後通常導向首頁
    await page.waitForURL(`${UI}/#/`);

    // Then the article should no longer appear in the article list on the home page
    const globalFeedTab = page.getByRole('button', { name: /global feed/i }).or(page.getByText(/global feed/i));
    if (await globalFeedTab.isVisible()) {
      await globalFeedTab.click();
    }

    await expect(page.getByRole('heading', { name: article.title })).not.toBeVisible();
    await expect(page.getByText(article.title)).not.toBeVisible();
  });
});