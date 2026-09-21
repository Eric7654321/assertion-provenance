import { test, expect } from '@playwright/test';
import { newArticle, newUser, loginAs, UI } from '../support/fixtures';

test('S07: author can delete their own article', async ({ page }) => {
  const author = await newUser();
  const article = await newArticle(author);

  await loginAs(page, author);
  await page.goto(`${UI}/#/article/${article.slug}`);

  const deleteButton = page.getByRole('button', { name: /delete article/i });
  await expect(deleteButton).toBeVisible();

  await deleteButton.click();

  await expect(page).toHaveURL(new RegExp(`${UI.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/#/?$`));

  await expect(
    page.getByRole('link', { name: article.title, exact: true }),
  ).not.toBeVisible();
});