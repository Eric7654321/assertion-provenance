import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Requirements', () => {
  test('@item:H04 Scenario: Follow and unfollow', async ({ page }) => {
    // 建立作者 A 並發布一篇文章
    const authorA = await newUser();
    const article = await newArticle(authorA, {
      title: `Article by Author A ${Date.now()}`,
      description: 'Author A article description',
      body: 'Author A article body text.',
      tagList: ['test'],
    });

    // 建立使用者 B 並登入
    const userB = await newUser();
    await loginAs(page, userB);

    // Given user B opens author A's profile page and clicks follow
    await page.goto(`${UI}/#/@${authorA.username}`);

    const followButton = page.getByRole('button', { name: new RegExp(`Follow ${authorA.username}|Follow`, 'i') });
    await expect(followButton).toBeVisible();
    await expect(followButton).toContainText('Follow');
    await expect(followButton).not.toContainText('Unfollow');

    await followButton.click();

    // 確認按鈕狀態更新為 Unfollow
    const unfollowButton = page.getByRole('button', { name: new RegExp(`Unfollow ${authorA.username}|Unfollow`, 'i') });
    await expect(unfollowButton).toBeVisible();

    // When user B returns to the home page and switches to Your Feed
    await page.goto(`${UI}/#/`);
    const yourFeedTab = page.getByRole('button', { name: 'Your Feed' });
    await yourFeedTab.click();

    // Then the follow button and Your Feed should reflect the followed state
    await expect(page.getByText(article.title)).toBeVisible();

    // When user B returns to author A's profile page and clicks unfollow
    await page.goto(`${UI}/#/@${authorA.username}`);
    await expect(unfollowButton).toBeVisible();
    await unfollowButton.click();

    // Then follow button reverts to original state
    await expect(followButton).toBeVisible();
    await expect(followButton).not.toContainText('Unfollow');

    // And switches to Your Feed again
    await page.goto(`${UI}/#/`);
    await yourFeedTab.click();

    // Then Your Feed should revert to its original state (no articles from author A)
    await expect(page.getByText(article.title)).not.toBeVisible();
  });
});