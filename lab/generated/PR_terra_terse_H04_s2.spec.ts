import { test, expect } from '@playwright/test';
import { newArticle, newUser, loginAs, UI } from '../support/fixtures';

test.describe('Feature: Conduit Acceptance Requirements', () => {
  test('@item:H04 Follow and unfollow', async ({ page }) => {
    const author = await newUser();
    const follower = await newUser();
    const article = await newArticle(author);

    await loginAs(page, follower);

    await page.goto(`${UI}/#/profile/${author.username}`);
    await expect(page).toHaveURL(new RegExp(`#/profile/${author.username}$`));

    const followButton = page.getByRole('button', {
      name: new RegExp(`Follow\\s+${author.username}`),
    });

    await expect(followButton).toBeVisible();
    await followButton.click();

    await expect(
      page.getByRole('button', {
        name: new RegExp(`Unfollow\\s+${author.username}`),
      }),
    ).toBeVisible();

    await page.goto(`${UI}/#/`);
    await page.getByRole('link', { name: 'Your Feed' }).click();

    await expect(page.getByRole('link', { name: article.title })).toBeVisible();

    await page.goto(`${UI}/#/profile/${author.username}`);

    const unfollowButton = page.getByRole('button', {
      name: new RegExp(`Unfollow\\s+${author.username}`),
    });

    await expect(unfollowButton).toBeVisible();
    await unfollowButton.click();

    await expect(
      page.getByRole('button', {
        name: new RegExp(`Follow\\s+${author.username}`),
      }),
    ).toBeVisible();

    await page.goto(`${UI}/#/`);
    await page.getByRole('link', { name: 'Your Feed' }).click();

    await expect(page.getByRole('link', { name: article.title })).toHaveCount(0);
    await expect(page.getByText('No articles are here... yet.')).toBeVisible();
  });
});