import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('@item:H04 Follow and unfollow', async ({ page }) => {
    // 建立 Author A 並發表文章
    const authorA = await newUser();
    const articleA = await newArticle(authorA);

    // 建立 User B 並登入
    const userB = await newUser();
    await loginAs(page, userB);

    // Given User B views Author A's profile page
    await page.goto(`${UI}/#/profile/${encodeURIComponent(authorA.username)}`);

    // When User B chooses to follow Author A
    const followButton = page.getByRole('button', { name: new RegExp(`Follow ${authorA.username}`, 'i') });
    await expect(followButton).toBeVisible();
    await followButton.click();

    // Then the follow button changes to an unfollow state
    const unfollowButton = page.getByRole('button', { name: new RegExp(`Unfollow ${authorA.username}`, 'i') });
    await expect(unfollowButton).toBeVisible();

    // When User B goes to the home page and switches to "Your Feed"
    await page.goto(`${UI}/#/`);
    await page.getByRole('button', { name: 'Your Feed' }).click();

    // Then Author A's articles appear in "Your Feed"
    await expect(page.getByRole('heading', { name: articleA.title })).toBeVisible();

    // When User B returns to Author A's profile page and chooses to unfollow Author A
    await page.goto(`${UI}/#/profile/${encodeURIComponent(authorA.username)}`);
    await expect(unfollowButton).toBeVisible();
    await unfollowButton.click();

    // Then the button returns to its original state
    await expect(followButton).toBeVisible();

    // When User B switches to "Your Feed" again
    await page.goto(`${UI}/#/`);
    await page.getByRole('button', { name: 'Your Feed' }).click();

    // Then Author A's articles no longer appear
    await expect(page.getByRole('heading', { name: articleA.title })).not.toBeVisible();

    // And an empty state is displayed when there are no articles in "Your Feed"
    await expect(page.getByText(/Articles not available|No articles are here yet/i)).toBeVisible();
  });
});