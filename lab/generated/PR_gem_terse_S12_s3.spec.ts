import { test, expect } from '@playwright/test';
import { UI } from '../support/fixtures';

test.describe('Article list pagination', () => {
  test('@item:S12 should display different articles after changing to page 2', async ({ page }) => {
    // Given the user is on the article list on the home page
    await page.goto(`${UI}/#/`);

    const paginationNav = page.getByRole('navigation', { name: 'Pagination' });
    await expect(paginationNav).toBeVisible();

    // 取得第 1 頁的文章標題列表
    const articleHeadings = page.locator('main h1');
    await expect(articleHeadings.first()).toBeVisible();
    const firstPageHeadings = await articleHeadings.allInnerTexts();

    // When the user scrolls to the pagination bar and clicks page 2
    const page2Button = paginationNav.getByRole('button', { name: '2', exact: true });
    await page2Button.scrollIntoViewIfNeeded();
    await page2Button.click();

    // 等待分頁切換後內容更新
    await expect(page2Button).toHaveAttribute('aria-current', 'page').catch(async () => {
      // 若沒有 aria-current，確保第 1 頁與第 2 頁文章內容有所變更
    });

    // Then different articles are displayed after changing the page
    await expect(async () => {
      const secondPageHeadings = await articleHeadings.allInnerTexts();
      expect(secondPageHeadings.length).toBeGreaterThan(0);
      expect(secondPageHeadings).not.toEqual(firstPageHeadings);
    }).toPass();
  });
});