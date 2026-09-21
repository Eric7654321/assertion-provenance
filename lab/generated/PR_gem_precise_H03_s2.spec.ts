import { test, expect } from '@playwright/test';
import { newUser, newArticle, UI } from '../support/fixtures';

test.describe('Tag-filtered pagination', () => {
  test('Tag-filtered pagination flow', async ({ page, context }) => {
    // 建立 15 篇特定標籤的文章
    const user = await newUser();
    const uniqueTag = `tag-${Date.now()}`;
    const titles: string[] = [];

    for (let i = 1; i <= 15; i++) {
      const title = `Article ${i.toString().padStart(2, '0')} ${uniqueTag}`;
      titles.push(title);
      await newArticle(user, {
        title,
        description: `Description ${i}`,
        body: `Body content ${i}`,
        tagList: [uniqueTag],
      });
    }

    // When the user filters by that tag on the home page
    await page.goto(`${UI}/#/`);

    const tagButton = page.getByRole('button', { name: uniqueTag });
    await expect(tagButton).toBeVisible();
    await tagButton.click();

    // 確認標籤分頁已被選取
    await expect(page.getByRole('button', { name: `# ${uniqueTag}` })).toBeVisible();

    // Then the number of articles per page should match the pagination settings
    // 預設每頁 10 篇
    const articlePreviews = page.locator('.article-preview');
    await expect(articlePreviews).toHaveCount(10);

    // 檢查分頁控制項存在
    const page2Button = page.getByRole('button', { name: 'Page 2' });
    await expect(page2Button).toBeVisible();

    // When the user selects page 2 from the pagination controls
    await page2Button.click();

    // Then the articles displayed should be the continuation of the list (5 篇)
    await expect(articlePreviews).toHaveCount(5);
    await expect(page.getByRole('button', { name: 'Page 2 is your current page' })).toBeVisible();

    // And the URL should reflect the current page number
    await expect(page).toHaveURL(/page=2/);
    const targetUrl = page.url();

    // When the user directly navigates to the URL with page=2 in a new page
    const newTab = await context.newPage();
    await newTab.goto(targetUrl);

    // Then the user should arrive at the same page
    const newTabPreviews = newTab.locator('.article-preview');
    await expect(newTabPreviews).toHaveCount(5);
    await expect(newTab.getByRole('button', { name: 'Page 2 is your current page' })).toBeVisible();
    await newTab.close();

    // When the user switches back to the all articles list (Global Feed)
    await page.getByRole('button', { name: 'Global Feed' }).click();

    // Then the list should return to page 1
    await expect(page.getByRole('button', { name: 'Page 1 is your current page' })).toBeVisible();
    await expect(page).not.toHaveURL(/page=2/);
  });
});