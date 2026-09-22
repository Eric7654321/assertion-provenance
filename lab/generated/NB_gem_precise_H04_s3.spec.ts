import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('Follow and unfollow (@item:H04)', async ({ page }) => {
    // Setup users and an article authored by user A
    const authorA = await newUser();
    const userB = await newUser();
    const articleA = await newArticle(authorA);

    // Login as user B
    await loginAs(page, userB);

    // When user B opens author A's profile page and follows author A
    await page.goto(`${UI}/#/profile/${encodeURIComponent(authorA.username)}`);

    const followButton = page.getByRole('button', { name: new RegExp(`Follow ${authorA.username}`, 'i') });
    await expect(followButton).toBeVisible();
    await followButton.click();

    // Then the follow button switches to an unfollow state
    const unfollowButton = page.getByRole('button', { name: new RegExp(`Unfollow ${authorA.username}`, 'i') });
    await expect(unfollowButton).toBeVisible();

    // When user B goes to the home page and switches to "Your Feed"
    await page.goto(`${UI}/#/`);
    const yourFeedTab = page.getByRole('button', { name: /Your Feed/i }).or(page.getByRole('link', { name: /Your Feed/i }));
    await yourFeedTab.click();

    // Then author A's articles appear in "Your Feed"
    await expect(page.getByRole('heading', { name: articleA.title })).toBeVisible();

    // When user B returns to author A's profile page and unfollows author A
    await page.goto(`${UI}/#/profile/${encodeURIComponent(authorA.username)}`);
    await expect(unfollowButton).toBeVisible();
    await unfollowButton.click();

    // Then the button returns to its original follow state
    await expect(followButton).toBeVisible();

    // When user B switches to "Your Feed" again
    await page.goto(`${UI}/#/`);
    await yourFeedTab.click();

    // Then author A's articles no longer appear in "Your Feed"
    await expect(page.getByRole('heading', { name: articleA.title })).not.toBeVisible();

    // And "Your Feed" displays an empty state when there are no articles
    await expect(page.getByText(/No articles are here\.\.\. yet\./i)).toBeVisible();
  });
});