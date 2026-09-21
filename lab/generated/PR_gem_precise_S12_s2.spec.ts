import { test, expect } from '@playwright/test';
import { UI, apiCall, newUser, newArticle } from '../support/fixtures';

test.describe('Conduit Acceptance Criteria', () => {
  test('@item:S12 Scenario: Article list pagination', async ({ page }) => {
    // 建立文章以確保有足夠分頁資料，或者確認當前已有足夠文章
    // Conduit 首頁一頁預設為 10 篇，先建立使用者並確保文章數至少超過一頁
    const user = await newUser();
    const probeArticle = await newArticle(user, {
      title: `Pagination Test Probe ${Date.now()}`,
      description: 'Pagination description',
      body: 'Pagination body',
      tagList: ['pagination-test'],
    });

    // 瀏覽至首頁
    await page.goto(`${UI}/#/`);

    // 等待首頁文章列表載入完畢，並記錄第一頁顯示的文章標題
    const articleHeadings = page.locator('.article-preview h1');
    await expect(articleHeadings.first()).toBeVisible();
    const page1Articles = await articleHeadings.allTextContents();

    // 確認分頁控制項存在
    const page2Button = page.getByRole('button', { name: 'Page 2' });
    await expect(page2Button).toBeVisible();

    // 點選第二頁
    await page2Button.click();

    // 等待第二頁按鈕變成目前頁面狀態，或確認文章列表更新
    await expect(page.getByRole('button', { name: 'Page 2 is your current page' })).toBeVisible();

    // 驗證第二頁顯示的文章與第一頁不同（是接續的清單）
    const page2Articles = await articleHeadings.allTextContents();
    expect(page2Articles.length).toBeGreaterThan(0);
    expect(page2Articles).not.toEqual(page1Articles);

    // 第一篇第二頁文章不應出現在第一頁（確保分頁真的切換並顯示接續的文章）
    expect(page1Articles).not.toContain(page2Articles[0]);
  });
});