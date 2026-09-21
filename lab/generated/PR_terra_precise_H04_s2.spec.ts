import { test, expect } from '@playwright/test';
import {
  newUser,
  newArticle,
  loginAs,
  UI,
} from '../support/fixtures';

test.describe('Feature: Conduit Acceptance Criteria', () => {
  test('@item:H04 Follow and unfollow author', async ({ page }) => {
    const author = await newUser();
    const follower = await newUser();
    const article = await newArticle(author);

    await loginAs(page, follower);

    await page.goto(`${UI}/#/profile/${author.username}`);
    await expect(page).toHaveURL(new RegExp(`#/profile/${author.username}$`));

    const followButton = page.getByRole('button', {
      name: new RegExp(`Follow\\s+${author.username}`, 'i'),
    });

    await expect(followButton).toBeVisible();
    await followButton.click();

    const unfollowButton = page.getByRole('button', {
      name: new RegExp(`Unfollow\\s+${author.username}`, 'i'),
    });
    await expect(unfollowButton).toBeVisible();

    await page.goto(`${UI}/#/`);
    await page.getByRole('link', { name: 'Your Feed' }).click();

    await expect(page.getByRole('link', { name: article.title })).toBeVisible();

    await page.goto(`${UI}/#/profile/${author.username}`);
    await expect(unfollowButton).toBeVisible();
    await unfollowButton.click();

    await expect(followButton).toBeVisible();

    await page.goto(`${UI}/#/`);
    await page.getByRole('link', { name: 'Your Feed' }).click();

    await expect(page.getByText('No articles are here... yet.')).toBeVisible();
    await expect(page.getByRole('link', { name: article.title })).not.toBeVisible();
  });
});