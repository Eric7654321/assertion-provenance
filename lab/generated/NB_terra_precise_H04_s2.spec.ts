import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Criteria', () => {
  test('H04 - Follow and unfollow author', async ({ page }) => {
    const author = await newUser();
    const follower = await newUser();
    const article = await newArticle(author);

    await loginAs(page, follower);

    await page.goto(`${UI}/#/profile/${author.username}`);
    await expect(page.getByRole('button', { name: new RegExp(`Follow ${author.username}`) })).toBeVisible();

    await page.getByRole('button', { name: new RegExp(`Follow ${author.username}`) }).click();
    await expect(page.getByRole('button', { name: new RegExp(`Unfollow ${author.username}`) })).toBeVisible();

    await page.goto(`${UI}/#/`);
    await page.getByRole('link', { name: 'Your Feed' }).click();

    await expect(page.getByRole('link', { name: article.title })).toBeVisible();

    await page.goto(`${UI}/#/profile/${author.username}`);
    await page.getByRole('button', { name: new RegExp(`Unfollow ${author.username}`) }).click();

    await expect(page.getByRole('button', { name: new RegExp(`Follow ${author.username}`) })).toBeVisible();

    await page.goto(`${UI}/#/`);
    await page.getByRole('link', { name: 'Your Feed' }).click();

    await expect(page.getByText('No articles are here... yet.')).toBeVisible();
    await expect(page.getByRole('link', { name: article.title })).not.toBeVisible();
  });
});