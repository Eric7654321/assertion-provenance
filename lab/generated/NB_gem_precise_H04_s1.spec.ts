import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('Follow and unfollow (@item:H04)', async ({ page }) => {
    // Background / Setup:
    // Create Author A and User B
    const authorA = await newUser();
    const userB = await newUser();

    // Author A creates an article
    const articleA = await newArticle(authorA);

    // Given User B views Author A's profile page
    await loginAs(page, userB);
    await page.goto(`${UI}/#/profile/${encodeURIComponent(authorA.username)}`);

    // Locate the follow button on Author A's profile
    // Typically contains "+ Follow <username>" or "Follow <username>"
    const followButton = page.locator('button.action-btn', { hasText: authorA.username });
    await expect(followButton).toBeVisible();
    await expect(followButton).toContainText(`Follow ${authorA.username}`);

    // When User B chooses to follow Author A
    await followButton.click();

    // Then the follow button changes to an unfollow state
    await expect(followButton).toContainText(`Unfollow ${authorA.username}`);

    // When User B goes to the home page and switches to "Your Feed"
    await page.goto(`${UI}/#/`);
    const yourFeedTab = page.getByRole('link', { name: 'Your Feed' });
    await yourFeedTab.click();

    // Then Author A's articles appear in "Your Feed"
    await expect(page.locator('.article-preview').first()).toBeVisible();
    await expect(page.locator('.article-preview')).toContainText(articleA.title);

    // When User B returns to Author A's profile page and chooses to unfollow Author A
    await page.goto(`${UI}/#/profile/${encodeURIComponent(authorA.username)}`);
    await expect(followButton).toContainText(`Unfollow ${authorA.username}`);
    await followButton.click();

    // Then the button returns to its original state
    await expect(followButton).toContainText(`Follow ${authorA.username}`);

    // When User B switches to "Your Feed" again
    await page.goto(`${UI}/#/`);
    await yourFeedTab.click();

    // Then Author A's articles no longer appear
    await expect(page.getByText(articleA.title)).not.toBeVisible();

    // And an empty state is displayed when there are no articles in "Your Feed"
    await expect(page.getByText('No articles are here... yet.')).toBeVisible();
  });
});