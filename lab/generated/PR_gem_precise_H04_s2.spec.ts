import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, UI } from '../support/fixtures';

test.describe('Feature: Conduit Acceptance Criteria', () => {
  test('@item:H04 Scenario: Follow and unfollow author', async ({ page }) => {
    // 建立作者 A 與文章，以及使用者 B
    const authorA = await newUser();
    const articleA = await newArticle(authorA);
    const userB = await newUser();

    // 登入為 user B
    await loginAs(page, userB);

    // Given user B opens author A's profile page
    await page.goto(`${UI}/#/profile/${authorA.username}`);

    // When user B follows author A
    const followButton = page.getByRole('button', { name: new RegExp(`Follow ${authorA.username}`, 'i') });
    await expect(followButton).toBeVisible();
    await followButton.click();

    // Then the follow button should change to an unfollow state
    const unfollowButton = page.getByRole('button', { name: new RegExp(`Unfollow ${authorA.username}`, 'i') });
    await expect(unfollowButton).toBeVisible();

    // When user B returns to the home page and switches to Your Feed
    await page.goto(`${UI}/#/`);
    await page.getByRole('button', { name: 'Your Feed' }).click();

    // Then author A's articles should appear in Your Feed
    await expect(page.getByRole('heading', { name: articleA.title })).toBeVisible();

    // When user B returns to author A's profile page and unfollows author A
    await page.goto(`${UI}/#/profile/${authorA.username}`);
    await expect(unfollowButton).toBeVisible();
    await unfollowButton.click();

    // Then the button should return to its original state
    await expect(followButton).toBeVisible();

    // When user B switches to Your Feed again
    await page.goto(`${UI}/#/`);
    await page.getByRole('button', { name: 'Your Feed' }).click();

    // Then author A's articles should no longer appear
    await expect(page.getByRole('heading', { name: articleA.title })).not.toBeVisible();

    // And Your Feed should display an empty state when there are no articles
    await expect(page.getByText('Articles not available.')).toBeVisible();
  });
});