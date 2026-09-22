import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Criteria', () => {
  test('@item:H04 Follow and unfollow author', async ({ page }) => {
    // 建立作者 A 及使用者 B，並讓作者 A 發佈一篇文章
    const authorA = await newUser();
    const userB = await newUser();
    const articleA = await newArticle(authorA);

    // 使用者 B 登入並進入作者 A 的個人檔案頁面
    await loginAs(page, userB);
    await page.goto(`${UI}/#/profile/${encodeURIComponent(authorA.username)}`);

    // 找到追蹤按鈕，驗證初始狀態為 Follow
    const followButton = page.getByRole('button', { name: new RegExp(`Follow ${authorA.username}`, 'i') });
    const unfollowButton = page.getByRole('button', { name: new RegExp(`Unfollow ${authorA.username}`, 'i') });
    await expect(followButton).toBeVisible();

    // When user B follows author A
    await followButton.click();

    // Then the follow button should change to an unfollow state
    await expect(unfollowButton).toBeVisible();

    // When user B returns to the home page and switches to Your Feed
    await page.goto(`${UI}/#/`);
    const yourFeedTab = page.getByRole('button', { name: /Your Feed/i });
    await yourFeedTab.click();

    // Then author A's articles should appear in Your Feed
    await expect(page.getByText(articleA.title)).toBeVisible();

    // When user B returns to author A's profile page and unfollows author A
    await page.goto(`${UI}/#/profile/${encodeURIComponent(authorA.username)}`);
    await expect(unfollowButton).toBeVisible();
    await unfollowButton.click();

    // Then the button should return to its original state
    await expect(followButton).toBeVisible();

    // When user B switches to Your Feed again
    await page.goto(`${UI}/#/`);
    await yourFeedTab.click();

    // Then author A's articles should no longer appear
    await expect(page.getByText(articleA.title)).not.toBeVisible();

    // And Your Feed should display an empty state when there are no articles
    await expect(page.getByText(/No articles are here\.\.\. yet\./i)).toBeVisible();
  });
});