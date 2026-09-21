import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('Follow and unfollow', async ({ page }) => {
    // 建立作者 A 和 使用者 B
    const authorA = await newUser();
    const userB = await newUser();

    // 作者 A 發布一篇文章
    const articleA = await newArticle(authorA);

    // 使用者 B 登入
    await loginAs(page, userB);

    // When user B opens author A's profile page and follows author A
    await page.goto(`${UI}/#/profile/${authorA.username}`);

    const followButton = page.getByRole('button', { name: new RegExp(`Follow ${authorA.username}|Unfollow ${authorA.username}`) });
    await expect(followButton).toHaveText(`Follow ${authorA.username}`);
    await followButton.click();

    // Then the follow button switches to an unfollow state
    await expect(followButton).toHaveText(`Unfollow ${authorA.username}`);

    // When user B goes to the home page and switches to "Your Feed"
    await page.goto(`${UI}/#/`);
    await page.getByRole('button', { name: 'Your Feed' }).click();

    // Then author A's articles appear in "Your Feed"
    await expect(page.getByRole('heading', { name: articleA.title })).toBeVisible();

    // When user B returns to author A's profile page and unfollows author A
    await page.goto(`${UI}/#/profile/${authorA.username}`);
    await expect(followButton).toHaveText(`Unfollow ${authorA.username}`);
    await followButton.click();

    // Then the button returns to its original follow state
    await expect(followButton).toHaveText(`Follow ${authorA.username}`);

    // When user B switches to "Your Feed" again
    await page.goto(`${UI}/#/`);
    await page.getByRole('button', { name: 'Your Feed' }).click();

    // Then author A's articles no longer appear in "Your Feed"
    await expect(page.getByRole('heading', { name: articleA.title })).not.toBeVisible();

    // And "Your Feed" displays an empty state when there are no articles
    await expect(page.getByText('Articles not available.')).toBeVisible();
  });
});