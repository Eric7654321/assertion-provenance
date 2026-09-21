import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('Follow and unfollow (@item:H04)', async ({ page }) => {
    // 建立作者 A 及其文章，並建立使用者 B
    const authorA = await newUser();
    const articleA = await newArticle(authorA);
    const userB = await newUser();

    // 使用者 B 登入
    await loginAs(page, userB);

    // Given user B opens author A's profile page and clicks follow
    await page.goto(`${UI}/#/profile/${authorA.username}`);
    const followButton = page.getByRole('button', { name: new RegExp(`Follow ${authorA.username}`, 'i') });
    await expect(followButton).toBeVisible();
    await followButton.click();

    const unfollowButton = page.getByRole('button', { name: new RegExp(`Unfollow ${authorA.username}`, 'i') });
    await expect(unfollowButton).toBeVisible();

    // When user B returns to the home page and switches to Your Feed
    await page.goto(`${UI}/#/`);
    await page.getByRole('button', { name: 'Your Feed' }).click();

    // Then the button and Your Feed reflect the followed state
    await expect(page.getByText(articleA.title)).toBeVisible();

    // When user B returns to author A's profile page and clicks unfollow
    await page.goto(`${UI}/#/profile/${authorA.username}`);
    await expect(unfollowButton).toBeVisible();
    await unfollowButton.click();
    await expect(followButton).toBeVisible();

    // And user B switches to Your Feed again
    await page.goto(`${UI}/#/`);
    await page.getByRole('button', { name: 'Your Feed' }).click();

    // Then the state returns to the original state
    await expect(page.getByText(articleA.title)).not.toBeVisible();
    await expect(page.getByText('No articles are here... yet.')).toBeVisible();
  });
});