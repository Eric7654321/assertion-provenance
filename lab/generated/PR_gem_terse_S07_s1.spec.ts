import { test, expect } from '@playwright/test';
import { newUser, newArticle, loginAs, UI } from '../support/fixtures';

test.describe('Conduit Acceptance Requirements', () => {
  test('@item:S07 Scenario: Author deletes their own article', async ({ page }) => {
    // Given an author opens their own article page
    const author = await newUser();
    const article = await newArticle(author);

    await loginAs(page, author);
    await page.goto(`${UI}/#/article/${article.slug}`);

    // When the author clicks delete article
    await page.getByRole('button', { name: 'Delete Article' }).first().click();

    // Then the article should disappear from the list (redirects to home/global feed or profile)
    await page.goto(`${UI}/#/`);
    await expect(page.getByRole('heading', { name: article.title })).not.toBeVisible();
  });
});