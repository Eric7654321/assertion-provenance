import { test, expect } from '@playwright/test';
import { UI, newUser, newArticle, apiCall } from '../support/fixtures';

test.describe('Article list pagination', () => {
  test('Article list pagination', async ({ page }) => {
    // 取得 global feed 的文章，確保有足夠分頁，或者比對第 1 頁與第 2 頁的文章
    const res = await apiCall('articles?limit=10&offset=0', 'GET');
    const articlesPage1 = res.json?.articles || [];

    // 若文章不足以分頁（例如少於 11 篇），動態建立文章確保有第二頁
    if (res.json?.articlesCount <= 10) {
      const user = await newUser();
      const needed = 11 - res.json.articlesCount;
      for (let i = 0; i < needed; i++) {
        await newArticle(user, { title: `Pagination Article ${Date.now()}_${i}` });
      }
    }

    const resPage2 = await apiCall('articles?limit=10&offset=10', 'GET');
    const expectedFirstArticlePage2 = resPage2.json?.articles?.[0]?.title;

    await page.goto(`${UI}/#/`);

    // Given I scroll to the pagination bar in the article list on the home page
    const page2Button = page.getByRole('button', { name: 'Page 2' });
    await page2Button.scrollIntoViewIfNeeded();
    await expect(page2Button).toBeVisible();

    // When I select page 2
    await page2Button.click();

    // Then the list displays the consecutive articles
    // Page 2 按鈕應成為當前頁面
    await expect(page.getByRole('button', { name: 'Page 2 is your current page' })).toBeVisible();

    // 檢查第二頁的文章內容出現
    if (expectedFirstArticlePage2) {
      await expect(page.getByRole('heading', { name: expectedFirstArticlePage2 })).toBeVisible();
    }
  });
});