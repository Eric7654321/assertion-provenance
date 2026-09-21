import { test, expect } from '@playwright/test';
import { newArticle, newUser, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Tests', () => {
  test('@item:H04 Follow and unfollow', async ({ page }) => {
    const author = await newUser();
    const follower = await newUser();
    const article = await newArticle(author);

    await loginAs(page, follower);

    await page.goto(`${UI}/#/profile/${author.username}`);
    await expect(page.getByRole('button', { name: new RegExp(`Follow\\s+${author.username}`, 'i') })).toBeVisible();

    await page.getByRole('button', { name: new RegExp(`Follow\\s+${author.username}`, 'i') }).click();
    await expect(page.getByRole('button', { name: new RegExp(`Unfollow\\s+${author.username}`, 'i') })).toBeVisible();

    await page.goto(`${UI}/#/`);
    await page.getByRole('link', { name: 'Your Feed' }).click();

    await expect(page.getByRole('link', { name: article.title })).toBeVisible();

    await page.goto(`${UI}/#/profile/${author.username}`);
    await page.getByRole('button', { name: new RegExp(`Unfollow\\s+${author.username}`, 'i') }).click();
    await expect(page.getByRole('button', { name: new RegExp(`Follow\\s+${author.username}`, 'i') })).toBeVisible();

    await page.goto(`${UI}/#/`);
    await page.getByRole('link', { name: 'Your Feed' }).click();

    await expect(page.getByRole('link', { name: article.title })).not.toBeVisible();
    await expect(page.getByText('No articles are here... yet.')).toBeVisible();
  });
});