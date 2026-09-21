import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Requirements', () => {
  test('@item:H04 Follow and unfollow', async ({ page }) => {
    // 建立 Author A 並發表一篇文章
    const authorA = await newUser();
    const article = await newArticle(authorA);

    // 建立 User B 並登入
    const userB = await newUser();
    await loginAs(page, userB);

    // Given User B opens Author A's profile page and clicks follow
    await page.goto(`${UI}/#/@${authorA.username}`);

    const followButton = page.getByRole('button', { name: new RegExp(`Follow ${authorA.username}`, 'i') });
    await expect(followButton).toBeVisible();
    await followButton.click();

    // 確認按鈕狀態更新為 Unfollow
    const unfollowButton = page.getByRole('button', { name: new RegExp(`Unfollow ${authorA.username}`, 'i') });
    await expect(unfollowButton).toBeVisible();

    // When User B goes to the home page and switches to Your Feed
    await page.goto(`${UI}/#/`);
    const yourFeedTab = page.getByRole('button', { name: 'Your Feed' });
    await yourFeedTab.click();

    // Then the button and Your Feed should reflect this state (文章出現在 Your Feed)
    await expect(page.getByRole('heading', { name: article.title })).toBeVisible();

    // When User B returns to Author A's profile page and clicks unfollow
    await page.goto(`${UI}/#/@${authorA.username}`);
    await expect(unfollowButton).toBeVisible();
    await unfollowButton.click();
    await expect(followButton).toBeVisible();

    // And User B switches to Your Feed again
    await page.goto(`${UI}/#/`);
    await yourFeedTab.click();

    // Then the state should return to what it was originally
    await expect(page.getByRole('heading', { name: article.title })).toBeHidden();
    await expect(page.getByText('Articles not available.')).toBeVisible();
  });
});