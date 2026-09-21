# Final P2 稽核包（143 條）

公開材料固定在 RealWorld commit `ebbcdeb8d55b42a3a613c787560498b8ef10003f`，共 36 個檔。核對器每一條都拿到**全部**這些檔（沒有逐條檢索），清單見文末。


**稽核方式**：看「該檔原始行」有沒有真的在講這條斷言的同一個可觀測行為。摘錄是否存在已由程式驗證過；要人看的是**支不支持**。


---

## P2-001 · H02 · gemini-3.8-flash · precise

**斷言**：`await expect(page.getByRole('link', { name: 'Sign in' }).first()).toBeVisible()`

**引用**：`specs/e2e/comments.spec.ts:108-112` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Wait for Angular to complete auth check - either comment form OR sign in link appears
    await page2.waitForSelector('textarea[placeholder="Write a comment..."], a[href="/login"]', { timeout: 10000 });
    // Should see sign in/sign up links instead of comment form
    await expect(page2.loc

**該檔原始行**

```
  108|     // Wait for Angular to complete auth check - either comment form OR sign in link appears
  109|     await page2.waitForSelector('textarea[placeholder="Write a comment..."], a[href="/login"]', { timeout: 10000 });
  110|     // Should see sign in/sign up links instead of comment form
  111|     await expect(page2.locator('a[href="/login"]')).toBeVisible();
  112|     await expect(page2.locator('textarea[placeholder="Write a comment..."]')).not.toBeVisible();
```

**核對器理由**：E2E 測試在未登入訪客查看文章頁時，明確斷言並驗證應顯示前往登入的連結（Sign in）而不是留言輸入框。


---

## P2-002 · H02 · gemini-3.8-flash · precise

**斷言**：`await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()`

**引用**：`specs/e2e/comments.spec.ts:102-113` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should require login to post comment', async ({ page, browser }) => {
    // Create a new context without authentication (not sharing cookies with page)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    // Visit the article and wait for navigati

**該檔原始行**

```
  102|   test('should require login to post comment', async ({ page, browser }) => {
  103|     // Create a new context without authentication (not sharing cookies with page)
  104|     const context2 = await browser.newContext();
  105|     const page2 = await context2.newPage();
  106|     // Visit the article and wait for navigation
  107|     await page2.goto(page.url(), { waitUntil: 'load' });
  108|     // Wait for Angular to complete auth check - either comment form OR sign in link appears
  109|     await page2.waitForSelector('textarea[placeholder="Write a comment..."], a[href="/login"]', { timeout: 10000 });
  110|     // Should see sign in/sign up links instead of comment form
  111|     await expect(page2.locator('a[href="/login"]')).toBeVisible();
  112|     await expect(page2.locator('textarea[placeholder="Write a comment..."]')).not.toBeVisible();
  113|     await context2.close();
```

**核對器理由**：E2E 測試在未登入訪客造訪文章頁時，明確斷言畫面應顯示導向登入的 Sign in 連結而非留言表單。


---

## P2-003 · H02 · gemini-3.8-flash · precise

**斷言**：`await expect(page.getByText(readerCommentBody)).toBeVisible()`

**引用**：`specs/e2e/comments.spec.ts:31-36` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should add a comment to an article', async ({ page }) => {
    const commentText = 'This is a test comment from Playwright!';
    await addComment(page, commentText);
    // Comment should be visible
    await expect(page.locator(`.card:not(.comment-form) .card-block:has-text("${commentText}

**該檔原始行**

```
   31|   test('should add a comment to an article', async ({ page }) => {
   32|     const commentText = 'This is a test comment from Playwright!';
   33|     await addComment(page, commentText);
   34|     // Comment should be visible
   35|     await expect(page.locator(`.card:not(.comment-form) .card-block:has-text("${commentText}")`)).toBeVisible();
   36|   });
```

**核對器理由**：E2E 測試明確驗證了在文章頁面新增留言後，該留言內容在頁面上必須為可見（toBeVisible）。


---

## P2-004 · H03 · gemini-3.8-flash · precise

**斷言**：`await expect(articlesLocator).toHaveCount(5)`

**引用**：`specs/e2e/url-navigation.spec.ts:266-268` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Second page should have 5 articles (15 - 10 = 5)
    const articlesOnPage2 = await page.locator('.article-preview').count();
    expect(articlesOnPage2).toBe(5);

**該檔原始行**

```
  266|     // Second page should have 5 articles (15 - 10 = 5)
  267|     const articlesOnPage2 = await page.locator('.article-preview').count();
  268|     expect(articlesOnPage2).toBe(5);
```

**核對器理由**：E2E 測試明確驗證了在建立 15 篇帶有該標籤的文章後，點選第 2 頁時文章列表剛好顯示剩餘的 5 篇。


---

## P2-005 · S02 · gemini-3.8-flash · precise

**斷言**：`await expect(errorMessage).toContainText('email')`

**引用**：`specs/e2e/error-handling.spec.ts:50-64` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should handle 400 on registration with validation errors', async ({ page }) => {
    await mockApiError(page, '/users', 400, {
      errors: {
        email: ['is already taken'],
        username: ['is too short (minimum is 3 characters)'],
      },
    });
    await page.goto('/register');

**該檔原始行**

```
   50|   test('should handle 400 on registration with validation errors', async ({ page }) => {
   51|     await mockApiError(page, '/users', 400, {
   52|       errors: {
   53|         email: ['is already taken'],
   54|         username: ['is too short (minimum is 3 characters)'],
   55|       },
   56|     });
   57|     await page.goto('/register');
   58|     await page.fill('input[name="username"]', 'ab');
   59|     await page.fill('input[name="email"]', 'taken@test.com');
   60|     await page.fill('input[name="password"]', 'password123');
   61|     await page.click('button[type="submit"]');
   62|     // Should show error messages
   63|     await expect(page.locator('.error-messages')).toBeVisible();
   64|     await expect(page).toHaveURL('/register');
```

**核對器理由**：公開規格中模板與 E2E 測試皆明示註冊時 email 重複錯誤會以「That email is already taken」或包含 email 的錯誤訊息呈現在 .error-messages 中。


---

## P2-006 · S07 · gemini-3.8-flash · precise

**斷言**：`await expect(page).toHaveURL(`${UI}/#/`)`

**引用**：`specs/e2e/articles.spec.ts:76-81` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Delete the article
    await deleteArticle(page);

    // Should be redirected to home
    await expect(page).toHaveURL('/');

**該檔原始行**

```
   76|     // Delete the article
   77|     await deleteArticle(page);
   78| 
   79|     // Should be redirected to home
   80|     await expect(page).toHaveURL('/');
   81| 
```

**核對器理由**：官方 E2E 測試在刪除文章後明確斷言應重定向至首頁（'/'）。


---

## P2-007 · S07 · gemini-3.8-flash · precise

**斷言**：`await expect(page).toHaveURL(`${UI}/#/`)`

**引用**：`specs/e2e/articles.spec.ts:79-80` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Should be redirected to home
    await expect(page).toHaveURL('/');

**該檔原始行**

```
   79|     // Should be redirected to home
   80|     await expect(page).toHaveURL('/');
```

**核對器理由**：官方 E2E 測試在刪除文章後明確斷言應重定向回首頁 URL ('/')。


---

## P2-008 · S09 · gemini-3.8-flash · precise

**斷言**：`await expect(cardB).toBeVisible()`

**引用**：`specs/e2e/comments.spec.ts:31-36` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should add a comment to an article', async ({ page }) => {
    const commentText = 'This is a test comment from Playwright!';
    await addComment(page, commentText);
    // Comment should be visible
    await expect(page.locator(`.card:not(.comment-form) .card-block:has-text("${commentText}

**該檔原始行**

```
   31|   test('should add a comment to an article', async ({ page }) => {
   32|     const commentText = 'This is a test comment from Playwright!';
   33|     await addComment(page, commentText);
   34|     // Comment should be visible
   35|     await expect(page.locator(`.card:not(.comment-form) .card-block:has-text("${commentText}")`)).toBeVisible();
   36|   });
```

**核對器理由**：官方 E2E 測試明確要求使用者新增留言後，該留言卡片內容在文章頁面中必須可見。


---

## P2-009 · H01 · gemini-3.8-flash · concise

**斷言**：`await expect(page.getByPlaceholder('Article Title')).toHaveValue(originalTitle)`

**引用**：`specs/e2e/articles.spec.ts:246-248` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Wait for the form to be populated
    const titleInput = page.locator('input[name="title"]');
    await expect(titleInput).not.toHaveValue('', { timeout: 10000 });

**該檔原始行**

```
  246|     // Wait for the form to be populated
  247|     const titleInput = page.locator('input[name="title"]');
  248|     await expect(titleInput).not.toHaveValue('', { timeout: 10000 });
```

**核對器理由**：官方測試在進入文章編輯頁後，明確檢查了標題輸入框（title input）已被填入既有文章標題而非空值。


---

## P2-010 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.getByRole('heading', { name: article.title })).toBeVisible()`

**引用**：`specs/e2e/articles.spec.ts:41-41` @ `ebbcdeb8d55b`

**模型給的摘錄**：    await expect(page.locator('h1')).toHaveText(article.title);

**該檔原始行**

```
   41|     await expect(page.locator('h1')).toHaveText(article.title);
```

**核對器理由**：E2E 測試在文章頁面直接斷言了表示文章標題的 heading (h1) 必須可見且包含該文章標題。


---

## P2-011 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.getByText(article.body)).toBeVisible()`

**引用**：`specs/e2e/articles.spec.ts:40-42` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Should show article content
    await expect(page.locator('h1')).toHaveText(article.title);
    await expect(page.locator('.article-content p')).toContainText(article.body);

**該檔原始行**

```
   40|     // Should show article content
   41|     await expect(page.locator('h1')).toHaveText(article.title);
   42|     await expect(page.locator('.article-content p')).toContainText(article.body);
```

**核對器理由**：E2E 測試明確斷言在文章頁上應顯示文章內容（article.body）。


---

## P2-012 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.getByText(authorCommentText)).toBeVisible()`

**引用**：`specs/e2e/comments.spec.ts:31-36` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should add a comment to an article', async ({ page }) => {
    const commentText = 'This is a test comment from Playwright!';
    await addComment(page, commentText);
    // Comment should be visible
    await expect(page.locator(`.card:not(.comment-form) .card-block:has-text("${commentText}

**該檔原始行**

```
   31|   test('should add a comment to an article', async ({ page }) => {
   32|     const commentText = 'This is a test comment from Playwright!';
   33|     await addComment(page, commentText);
   34|     // Comment should be visible
   35|     await expect(page.locator(`.card:not(.comment-form) .card-block:has-text("${commentText}")`)).toBeVisible();
   36|   });
```

**核對器理由**：E2E 測試明確驗證了在文章頁面建立留言後，該留言文字內容應該在畫面上可見。


---

## P2-013 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.getByRole('button', { name: /Delete Article/i })).toHaveCount(0)`

**引用**：`docs/src/content/docs/specifications/frontend/routing.md:14-15` @ `ebbcdeb8d55b`

**模型給的摘錄**：- Article page (URL: `/article/article-slug-here` )
  - Delete article button (only shown to article's author)

**該檔原始行**

```
   14| - Article page (URL: `/article/article-slug-here` )
   15|   - Delete article button (only shown to article's author)
```

**核對器理由**：契約明確規定文章頁上的「Delete article」按鈕僅向文章作者顯示，因此訪客（未登入使用者）瀏覽時不應存在該按鈕。


---

## P2-014 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.getByRole('link', { name: /Edit Article/i })).toHaveCount(0)`

**引用**：`specs/e2e/articles.spec.ts:282-305` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should only allow author to edit/delete article', async ({ page, browser }) => {
    const article = generateUniqueArticle();

    // Create article as first user
    await createArticle(page, article);

    // Get article URL
    const articleUrl = page.url();

    // Create a second user i

**該檔原始行**

```
  282|   test('should only allow author to edit/delete article', async ({ page, browser }) => {
  283|     const article = generateUniqueArticle();
  284| 
  285|     // Create article as first user
  286|     await createArticle(page, article);
  287| 
  288|     // Get article URL
  289|     const articleUrl = page.url();
  290| 
  291|     // Create a second user in new context (not sharing cookies with first user)
  292|     const context2 = await browser.newContext();
  293|     const page2 = await context2.newPage();
  294|     const user2 = generateUniqueUser();
  295|     await register(page2, user2.username, user2.email, user2.password);
  296| 
  297|     // Visit the article as second user
  298|     await page2.goto(articleUrl);
  299| 
  300|     // Should not see Edit/Delete buttons
  301|     await expect(page2.locator('a:has-text("Edit Article")')).not.toBeVisible();
  302|     await expect(page2.locator('button:has-text("Delete Article")')).not.toBeVisible();
  303| 
  304|     await context2.close();
  305|   });
```

**核對器理由**：E2E 測試明確規範並斷言非文章作者造訪文章頁時，不可看到 Edit Article 連結/按鈕。


---

## P2-015 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.getByPlaceholder('Write a comment...')).toHaveCount(0)`

**引用**：`specs/e2e/comments.spec.ts:102-113` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should require login to post comment', async ({ page, browser }) => {
    // Create a new context without authentication (not sharing cookies with page)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    // Visit the article and wait for navigati

**該檔原始行**

```
  102|   test('should require login to post comment', async ({ page, browser }) => {
  103|     // Create a new context without authentication (not sharing cookies with page)
  104|     const context2 = await browser.newContext();
  105|     const page2 = await context2.newPage();
  106|     // Visit the article and wait for navigation
  107|     await page2.goto(page.url(), { waitUntil: 'load' });
  108|     // Wait for Angular to complete auth check - either comment form OR sign in link appears
  109|     await page2.waitForSelector('textarea[placeholder="Write a comment..."], a[href="/login"]', { timeout: 10000 });
  110|     // Should see sign in/sign up links instead of comment form
  111|     await expect(page2.locator('a[href="/login"]')).toBeVisible();
  112|     await expect(page2.locator('textarea[placeholder="Write a comment..."]')).not.toBeVisible();
  113|     await context2.close();
```

**核對器理由**：E2E 測試中明確測試了未登入使用者訪問文章頁時，留言輸入框 textarea[placeholder="Write a comment..."] 不可見。


---

## P2-016 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()`

**引用**：`specs/e2e/comments.spec.ts:102-113` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should require login to post comment', async ({ page, browser }) => {
    // Create a new context without authentication (not sharing cookies with page)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    // Visit the article and wait for navigati

**該檔原始行**

```
  102|   test('should require login to post comment', async ({ page, browser }) => {
  103|     // Create a new context without authentication (not sharing cookies with page)
  104|     const context2 = await browser.newContext();
  105|     const page2 = await context2.newPage();
  106|     // Visit the article and wait for navigation
  107|     await page2.goto(page.url(), { waitUntil: 'load' });
  108|     // Wait for Angular to complete auth check - either comment form OR sign in link appears
  109|     await page2.waitForSelector('textarea[placeholder="Write a comment..."], a[href="/login"]', { timeout: 10000 });
  110|     // Should see sign in/sign up links instead of comment form
  111|     await expect(page2.locator('a[href="/login"]')).toBeVisible();
  112|     await expect(page2.locator('textarea[placeholder="Write a comment..."]')).not.toBeVisible();
  113|     await context2.close();
```

**核對器理由**：E2E 測試明確驗證未登入訪客造訪文章頁時，留言區會顯示 Sign in 連結而非留言表單。


---

## P2-017 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.locator('.mod-options')).toHaveCount(0)`

**引用**：`docs/src/content/docs/specifications/frontend/routing.md:18-18` @ `ebbcdeb8d55b`

**模型給的摘錄**：   - Delete comment button (only shown to comment's author)

**該檔原始行**

```
   18|   - Delete comment button (only shown to comment's author)
```

**核對器理由**：規格明確規定留言刪除按鈕（即 mod-options 內的刪除按鈕）僅顯示給該留言的作者，因此未登入訪客不應看到任何刪除按鈕。


---

## P2-018 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.getByRole('heading', { name: article.title })).toBeVisible()`

**引用**：`specs/e2e/articles.spec.ts:297-302` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Visit the article as second user
    await page2.goto(articleUrl);

    // Should not see Edit/Delete buttons
    await expect(page2.locator('a:has-text("Edit Article")')).not.toBeVisible();
    await expect(page2.locator('button:has-text("Delete Article")')).not.toBeVisible();

**該檔原始行**

```
  297|     // Visit the article as second user
  298|     await page2.goto(articleUrl);
  299| 
  300|     // Should not see Edit/Delete buttons
  301|     await expect(page2.locator('a:has-text("Edit Article")')).not.toBeVisible();
  302|     await expect(page2.locator('button:has-text("Delete Article")')).not.toBeVisible();
```

**核對器理由**：E2E 測試在 line 40-41 明確檢驗了文章頁顯示標題 `await expect(page.locator('h1')).toHaveText(article.title);`，且在 line 297-302 測試第二位登入的使用者造訪該文章頁時的呈現。


---

## P2-019 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.getByText(authorCommentText)).toBeVisible()`

**引用**：`specs/e2e/comments.spec.ts:133-138` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Now add our own comment
    const commentText = `Comment by logged in user ${Date.now()}`;
    await addComment(page, commentText);
    // Verify the delete button IS visible for OUR comment
    const ownComment = page.locator('.card', { has: page.locator(`text="${commentText}"`) });
    awai

**該檔原始行**

```
  133|     // Now add our own comment
  134|     const commentText = `Comment by logged in user ${Date.now()}`;
  135|     await addComment(page, commentText);
  136|     // Verify the delete button IS visible for OUR comment
  137|     const ownComment = page.locator('.card', { has: page.locator(`text="${commentText}"`) });
  138|     await expect(ownComment.locator('span.mod-options i.ion-trash-a')).toBeVisible();
```

**核對器理由**：測試明確驗證其他登入使用者開啟含既有留言之文章頁時，留言可正常呈現並可見。


---

## P2-020 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.getByRole('button', { name: /Delete Article/i })).toHaveCount(0)`

**引用**：`specs/e2e/articles.spec.ts:282-305` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should only allow author to edit/delete article', async ({ page, browser }) => {
    const article = generateUniqueArticle();

    // Create article as first user
    await createArticle(page, article);

    // Get article URL
    const articleUrl = page.url();

    // Create a second user i

**該檔原始行**

```
  282|   test('should only allow author to edit/delete article', async ({ page, browser }) => {
  283|     const article = generateUniqueArticle();
  284| 
  285|     // Create article as first user
  286|     await createArticle(page, article);
  287| 
  288|     // Get article URL
  289|     const articleUrl = page.url();
  290| 
  291|     // Create a second user in new context (not sharing cookies with first user)
  292|     const context2 = await browser.newContext();
  293|     const page2 = await context2.newPage();
  294|     const user2 = generateUniqueUser();
  295|     await register(page2, user2.username, user2.email, user2.password);
  296| 
  297|     // Visit the article as second user
  298|     await page2.goto(articleUrl);
  299| 
  300|     // Should not see Edit/Delete buttons
  301|     await expect(page2.locator('a:has-text("Edit Article")')).not.toBeVisible();
  302|     await expect(page2.locator('button:has-text("Delete Article")')).not.toBeVisible();
  303| 
  304|     await context2.close();
  305|   });
```

**核對器理由**：E2E 測試明確驗證非作者使用者造訪文章頁時，畫面上不能看到 Delete Article 按鈕。


---

## P2-021 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.getByRole('link', { name: /Edit Article/i })).toHaveCount(0)`

**引用**：`specs/e2e/articles.spec.ts:297-302` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Visit the article as second user
    await page2.goto(articleUrl);

    // Should not see Edit/Delete buttons
    await expect(page2.locator('a:has-text("Edit Article")')).not.toBeVisible();

**該檔原始行**

```
  297|     // Visit the article as second user
  298|     await page2.goto(articleUrl);
  299| 
  300|     // Should not see Edit/Delete buttons
  301|     await expect(page2.locator('a:has-text("Edit Article")')).not.toBeVisible();
  302|     await expect(page2.locator('button:has-text("Delete Article")')).not.toBeVisible();
```

**核對器理由**：公開 E2E 測試明確斷言非作者訪問文章頁面時，不可看見 Edit Article 連結/按鈕。


---

## P2-022 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.getByRole('button', { name: /Follow/i }).first()).toBeVisible()`

**引用**：`specs/e2e/SELECTORS.md:120-120` @ `ebbcdeb8d55b`

**模型給的摘錄**：| `Follow` / `Unfollow`     | `button` | Profile, article meta    |

**該檔原始行**

```
  120| | `Follow` / `Unfollow`     | `button` | Profile, article meta    |
```

**核對器理由**：SELECTORS.md 明確規定在 article meta 區域中存在可見文字為 Follow / Unfollow 的 button。


---

## P2-023 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.getByRole('button', { name: /Favorite/i }).first()).toBeVisible()`

**引用**：`specs/e2e/articles.spec.ts:169-171` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Wait for article page to load - should see Favorite button (not Delete button)
    await page.waitForSelector('button:has-text("Favorite")', { timeout: 10000 });

**該檔原始行**

```
  169|     // Wait for article page to load - should see Favorite button (not Delete button)
  170|     await page.waitForSelector('button:has-text("Favorite")', { timeout: 10000 });
  171| 
```

**核對器理由**：官方 E2E 測試明確驗證非文章作者的使用者造訪文章頁時，畫面上應顯示 Favorite 按鈕而不是 Delete 按鈕。


---

## P2-024 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(authorCard.locator('i.ion-trash-a, button.btn-outline-danger, .mod-options')).toHaveCount(0)`

**引用**：`docs/src/content/docs/specifications/frontend/routing.md:18-18` @ `ebbcdeb8d55b`

**模型給的摘錄**：   - Delete comment button (only shown to comment's author)

**該檔原始行**

```
   18|   - Delete comment button (only shown to comment's author)
```

**核對器理由**：規格明確規範文章頁上的刪除留言按鈕僅顯示給留言的作者，非作者讀者不應看到刪除按鈕。


---

## P2-025 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.getByText(readerCommentText)).toBeVisible()`

**引用**：`specs/e2e/comments.spec.ts:31-36` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should add a comment to an article', async ({ page }) => {
    const commentText = 'This is a test comment from Playwright!';
    await addComment(page, commentText);
    // Comment should be visible
    await expect(page.locator(`.card:not(.comment-form) .card-block:has-text("${commentText}

**該檔原始行**

```
   31|   test('should add a comment to an article', async ({ page }) => {
   32|     const commentText = 'This is a test comment from Playwright!';
   33|     await addComment(page, commentText);
   34|     // Comment should be visible
   35|     await expect(page.locator(`.card:not(.comment-form) .card-block:has-text("${commentText}")`)).toBeVisible();
   36|   });
```

**核對器理由**：E2E 規格明確測試了使用者在文章頁發表留言後，該留言內容在頁面上可見。


---

## P2-026 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(readerCard.locator('i.ion-trash-a, .mod-options')).toBeVisible()`

**引用**：`specs/e2e/comments.spec.ts:136-138` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Verify the delete button IS visible for OUR comment
    const ownComment = page.locator('.card', { has: page.locator(`text="${commentText}"`) });
    await expect(ownComment.locator('span.mod-options i.ion-trash-a')).toBeVisible();

**該檔原始行**

```
  136|     // Verify the delete button IS visible for OUR comment
  137|     const ownComment = page.locator('.card', { has: page.locator(`text="${commentText}"`) });
  138|     await expect(ownComment.locator('span.mod-options i.ion-trash-a')).toBeVisible();
```

**核對器理由**：E2E 測試明確驗證了登入使用者在發表留言後，自己留言卡片上的刪除圖示（.mod-options / ion-trash-a）必須可見。


---

## P2-027 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(authorCard.locator('i.ion-trash-a, .mod-options')).toHaveCount(0)`

**引用**：`docs/src/content/docs/specifications/frontend/routing.md:18-18` @ `ebbcdeb8d55b`

**模型給的摘錄**：   - Delete comment button (only shown to comment's author)

**該檔原始行**

```
   18|   - Delete comment button (only shown to comment's author)
```

**核對器理由**：規格明確規定文章頁上的刪除留言按鈕僅對該留言作者顯示，因此非作者（讀者）看作者留言時不得出現刪除按鈕。


---

## P2-028 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.getByText(authorCommentText)).toBeVisible()`

**引用**：`docs/src/content/docs/specifications/frontend/routing.md:14-18` @ `ebbcdeb8d55b`

**模型給的摘錄**：- Article page (URL: `/article/article-slug-here` )
  - Delete article button (only shown to article's author)
  - Render markdown from server client side
  - Comments section at bottom of page
  - Delete comment button (only shown to comment's author)

**該檔原始行**

```
   14| - Article page (URL: `/article/article-slug-here` )
   15|   - Delete article button (only shown to article's author)
   16|   - Render markdown from server client side
   17|   - Comments section at bottom of page
   18|   - Delete comment button (only shown to comment's author)
```

**核對器理由**：規格明確要求文章頁面底部包含留言區，訪客開啟文章頁面時應可觀測到該留言區內容。


---

## P2-029 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.getByRole('link', { name: /Edit Article/i })).not.toBeVisible()`

**引用**：`specs/e2e/articles.spec.ts:300-302` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Should not see Edit/Delete buttons
    await expect(page2.locator('a:has-text("Edit Article")')).not.toBeVisible();
    await expect(page2.locator('button:has-text("Delete Article")')).not.toBeVisible();

**該檔原始行**

```
  300|     // Should not see Edit/Delete buttons
  301|     await expect(page2.locator('a:has-text("Edit Article")')).not.toBeVisible();
  302|     await expect(page2.locator('button:has-text("Delete Article")')).not.toBeVisible();
```

**核對器理由**：E2E 測試明確斷言非作者使用者造訪文章頁時，不可看見 Edit Article 連結與 Delete Article 按鈕。


---

## P2-030 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.getByRole('button', { name: /Delete Article/i })).not.toBeVisible()`

**引用**：`docs/src/content/docs/specifications/frontend/routing.md:14-15` @ `ebbcdeb8d55b`

**模型給的摘錄**：- Article page (URL: `/article/article-slug-here` )
  - Delete article button (only shown to article's author)

**該檔原始行**

```
   14| - Article page (URL: `/article/article-slug-here` )
   15|   - Delete article button (only shown to article's author)
```

**核對器理由**：契約明確規定文章頁的 Delete article button 僅在身分為作者時顯示，因此訪客開啟該頁不可見。


---

## P2-031 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.getByPlaceholder('Write a comment...')).not.toBeVisible()`

**引用**：`specs/e2e/comments.spec.ts:102-113` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should require login to post comment', async ({ page, browser }) => {
    // Create a new context without authentication (not sharing cookies with page)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    // Visit the article and wait for navigati

**該檔原始行**

```
  102|   test('should require login to post comment', async ({ page, browser }) => {
  103|     // Create a new context without authentication (not sharing cookies with page)
  104|     const context2 = await browser.newContext();
  105|     const page2 = await context2.newPage();
  106|     // Visit the article and wait for navigation
  107|     await page2.goto(page.url(), { waitUntil: 'load' });
  108|     // Wait for Angular to complete auth check - either comment form OR sign in link appears
  109|     await page2.waitForSelector('textarea[placeholder="Write a comment..."], a[href="/login"]', { timeout: 10000 });
  110|     // Should see sign in/sign up links instead of comment form
  111|     await expect(page2.locator('a[href="/login"]')).toBeVisible();
  112|     await expect(page2.locator('textarea[placeholder="Write a comment..."]')).not.toBeVisible();
  113|     await context2.close();
```

**核對器理由**：測試明確驗證未登入訪客造訪文章頁時，留言輸入框 textarea[placeholder="Write a comment..."] 不可見。


---

## P2-032 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.getByRole('link', { name: 'Sign in', exact: true })).toBeVisible()`

**引用**：`specs/e2e/comments.spec.ts:108-112` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Wait for Angular to complete auth check - either comment form OR sign in link appears
    await page2.waitForSelector('textarea[placeholder="Write a comment..."], a[href="/login"]', { timeout: 10000 });
    // Should see sign in/sign up links instead of comment form
    await expect(page2.loc

**該檔原始行**

```
  108|     // Wait for Angular to complete auth check - either comment form OR sign in link appears
  109|     await page2.waitForSelector('textarea[placeholder="Write a comment..."], a[href="/login"]', { timeout: 10000 });
  110|     // Should see sign in/sign up links instead of comment form
  111|     await expect(page2.locator('a[href="/login"]')).toBeVisible();
  112|     await expect(page2.locator('textarea[placeholder="Write a comment..."]')).not.toBeVisible();
```

**核對器理由**：E2E 測試明確斷言未登入訪客訪問文章頁時，留言區不顯示輸入框，且可見 Sign in 連結。


---

## P2-033 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.getByRole('link', { name: 'Sign up', exact: true })).toBeVisible()`

**引用**：`docs/src/content/docs/specifications/frontend/templates.md:36-41` @ `ebbcdeb8d55b`

**模型給的摘錄**：If no user is logged in, then the header should include links to:

- the home page
- the login page
- the register page

**該檔原始行**

```
   36| If no user is logged in, then the header should include links to:
   37| 
   38| - the home page
   39| - the login page
   40| - the register page
   41| 
```

**核對器理由**：前端模板規範明確指出未登入使用者在 header 中應看到前往註冊頁（Sign up / register page）的連結。


---

## P2-034 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.getByText(article.body)).toBeVisible()`

**引用**：`specs/e2e/articles.spec.ts:38-42` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Should be on article page
    await expect(page).toHaveURL(/\/article\/.+/);

    // Should show article content
    await expect(page.locator('h1')).toHaveText(article.title);
    await expect(page.locator('.article-content p')).toContainText(article.body);

**該檔原始行**

```
   38|     await expect(page).toHaveURL(/\/article\/.+/);
   39| 
   40|     // Should show article content
   41|     await expect(page.locator('h1')).toHaveText(article.title);
   42|     await expect(page.locator('.article-content p')).toContainText(article.body);
```

**核對器理由**：E2E 測試明確斷言進入文章頁面後，應能在畫面上看到該文章的 body 內文。


---

## P2-035 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.getByText(authorCommentText)).toBeVisible()`

**引用**：`specs/e2e/comments.spec.ts:126-139` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Check if there are any existing comments (from other users like johndoe)
    const existingCommentsCount = await page.locator('.card:not(.comment-form)').count();
    // If there are existing comments, they should NOT have delete buttons (not our comments)
    if (existingCommentsCount > 0) {

**該檔原始行**

```
  126|     // Check if there are any existing comments (from other users like johndoe)
  127|     const existingCommentsCount = await page.locator('.card:not(.comment-form)').count();
  128|     // If there are existing comments, they should NOT have delete buttons (not our comments)
  129|     if (existingCommentsCount > 0) {
  130|       const firstExistingComment = page.locator('.card:not(.comment-form)').first();
  131|       await expect(firstExistingComment.locator('span.mod-options i.ion-trash-a')).not.toBeVisible();
  132|     }
  133|     // Now add our own comment
  134|     const commentText = `Comment by logged in user ${Date.now()}`;
  135|     await addComment(page, commentText);
  136|     // Verify the delete button IS visible for OUR comment
  137|     const ownComment = page.locator('.card', { has: page.locator(`text="${commentText}"`) });
  138|     await expect(ownComment.locator('span.mod-options i.ion-trash-a')).toBeVisible();
  139|   });
```

**核對器理由**：合約明確測試了當使用者造訪非自己所寫的文章時，其他使用者的既有留言依然可在頁面上被看見（存在於 DOM 中）。


---

## P2-036 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.getByRole('link', { name: /Edit Article/i })).not.toBeVisible()`

**引用**：`specs/e2e/articles.spec.ts:297-302` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Visit the article as second user
    await page2.goto(articleUrl);

    // Should not see Edit/Delete buttons
    await expect(page2.locator('a:has-text("Edit Article")')).not.toBeVisible();

**該檔原始行**

```
  297|     // Visit the article as second user
  298|     await page2.goto(articleUrl);
  299| 
  300|     // Should not see Edit/Delete buttons
  301|     await expect(page2.locator('a:has-text("Edit Article")')).not.toBeVisible();
  302|     await expect(page2.locator('button:has-text("Delete Article")')).not.toBeVisible();
```

**核對器理由**：E2E 測試明確規範非文章作者訪問文章頁時，不應看到「Edit Article」連結。


---

## P2-037 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.getByRole('button', { name: /Delete Article/i })).not.toBeVisible()`

**引用**：`specs/e2e/articles.spec.ts:282-304` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should only allow author to edit/delete article', async ({ page, browser }) => {
    const article = generateUniqueArticle();

    // Create article as first user
    await createArticle(page, article);

    // Get article URL
    const articleUrl = page.url();

    // Create a second user i

**該檔原始行**

```
  282|   test('should only allow author to edit/delete article', async ({ page, browser }) => {
  283|     const article = generateUniqueArticle();
  284| 
  285|     // Create article as first user
  286|     await createArticle(page, article);
  287| 
  288|     // Get article URL
  289|     const articleUrl = page.url();
  290| 
  291|     // Create a second user in new context (not sharing cookies with first user)
  292|     const context2 = await browser.newContext();
  293|     const page2 = await context2.newPage();
  294|     const user2 = generateUniqueUser();
  295|     await register(page2, user2.username, user2.email, user2.password);
  296| 
  297|     // Visit the article as second user
  298|     await page2.goto(articleUrl);
  299| 
  300|     // Should not see Edit/Delete buttons
  301|     await expect(page2.locator('a:has-text("Edit Article")')).not.toBeVisible();
  302|     await expect(page2.locator('button:has-text("Delete Article")')).not.toBeVisible();
  303| 
  304|     await context2.close();
```

**核對器理由**：E2E 測試明確驗證非文章作者的使用者瀏覽該文章頁面時，畫面上不應看見 Delete Article 按鈕。


---

## P2-038 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(commentInput).toBeVisible()`

**引用**：`specs/e2e/comments.spec.ts:108-112` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Wait for Angular to complete auth check - either comment form OR sign in link appears
    await page2.waitForSelector('textarea[placeholder="Write a comment..."], a[href="/login"]', { timeout: 10000 });
    // Should see sign in/sign up links instead of comment form
    await expect(page2.loc

**該檔原始行**

```
  108|     // Wait for Angular to complete auth check - either comment form OR sign in link appears
  109|     await page2.waitForSelector('textarea[placeholder="Write a comment..."], a[href="/login"]', { timeout: 10000 });
  110|     // Should see sign in/sign up links instead of comment form
  111|     await expect(page2.locator('a[href="/login"]')).toBeVisible();
  112|     await expect(page2.locator('textarea[placeholder="Write a comment..."]')).not.toBeVisible();
```

**核對器理由**：E2E 測試驗證未登入時看不到留言框 textarea[placeholder="Write a comment..."]，而登入使用者可見留言輸入框。


---

## P2-039 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.getByRole('button', { name: 'Post Comment' })).toBeVisible()`

**引用**：`specs/e2e/SELECTORS.md:113-115` @ `ebbcdeb8d55b`

**模型給的摘錄**：| Text                      | Element  | Context                  |
| ------------------------- | -------- | ------------------------ |
| `Post Comment`            | `button` | Article detail           |

**該檔原始行**

```
  113| | Text                      | Element  | Context                  |
  114| | ------------------------- | -------- | ------------------------ |
  115| | `Post Comment`            | `button` | Article detail           |
```

**核對器理由**：SELECTORS.md 明確規定在文章詳細頁（Article detail）存在按鈕文字為 'Post Comment' 的 button 元件。


---

## P2-040 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.getByText(authorCommentText)).toBeVisible()`

**引用**：`specs/e2e/comments.spec.ts:86-96` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should display multiple comments', async ({ page }) => {
    const comment1 = 'First comment';
    const comment2 = 'Second comment';
    const comment3 = 'Third comment';
    await addComment(page, comment1);
    await addComment(page, comment2);
    await addComment(page, comment3);
    //

**該檔原始行**

```
   86|   test('should display multiple comments', async ({ page }) => {
   87|     const comment1 = 'First comment';
   88|     const comment2 = 'Second comment';
   89|     const comment3 = 'Third comment';
   90|     await addComment(page, comment1);
   91|     await addComment(page, comment2);
   92|     await addComment(page, comment3);
   93|     // All comments should be visible (exclude comment form)
   94|     await expect(page.locator(`.card:not(.comment-form) .card-block:has-text("${comment1}")`)).toBeVisible();
   95|     await expect(page.locator(`.card:not(.comment-form) .card-block:has-text("${comment2}")`)).toBeVisible();
   96|     await expect(page.locator(`.card:not(.comment-form) .card-block:has-text("${comment3}")`)).toBeVisible();
```

**核對器理由**：官方 E2E 測試明確驗證文章頁面在發表多則留言後，先前發表的留言內容依舊維持可見（toBeVisible）。


---

## P2-041 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.getByText(readerCommentText)).toBeVisible()`

**引用**：`specs/e2e/comments.spec.ts:31-36` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should add a comment to an article', async ({ page }) => {
    const commentText = 'This is a test comment from Playwright!';
    await addComment(page, commentText);
    // Comment should be visible
    await expect(page.locator(`.card:not(.comment-form) .card-block:has-text("${commentText}

**該檔原始行**

```
   31|   test('should add a comment to an article', async ({ page }) => {
   32|     const commentText = 'This is a test comment from Playwright!';
   33|     await addComment(page, commentText);
   34|     // Comment should be visible
   35|     await expect(page.locator(`.card:not(.comment-form) .card-block:has-text("${commentText}")`)).toBeVisible();
   36|   });
```

**核對器理由**：E2E 測試明確驗證了在文章頁發表留言後，該留言內容在頁面上應為可見。


---

## P2-042 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(readerCommentCard.locator('.mod-options i, .ion-trash-a')).toBeVisible()`

**引用**：`specs/e2e/comments.spec.ts:136-138` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Verify the delete button IS visible for OUR comment
    const ownComment = page.locator('.card', { has: page.locator(`text="${commentText}"`) });
    await expect(ownComment.locator('span.mod-options i.ion-trash-a')).toBeVisible();

**該檔原始行**

```
  136|     // Verify the delete button IS visible for OUR comment
  137|     const ownComment = page.locator('.card', { has: page.locator(`text="${commentText}"`) });
  138|     await expect(ownComment.locator('span.mod-options i.ion-trash-a')).toBeVisible();
```

**核對器理由**：官方 E2E 測試明確驗證了登入使用者在文章頁上對自己所發表的留言，其刪除圖示按鈕（mod-options 下的 ion-trash-a）必須可見。


---

## P2-043 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(authorCommentCard.locator('.mod-options i, .ion-trash-a')).not.toBeVisible()`

**引用**：`docs/src/content/docs/specifications/frontend/routing.md:18-18` @ `ebbcdeb8d55b`

**模型給的摘錄**：- Delete comment button (only shown to comment's author)

**該檔原始行**

```
   18|   - Delete comment button (only shown to comment's author)
```

**核對器理由**：規格明確規定留言刪除按鈕只會顯示給該留言的作者，非留言作者不應看到該留言的刪除按鈕。


---

## P2-044 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.getByRole('button', { name: /Delete Article/i })).toHaveCount(0)`

**引用**：`docs/src/content/docs/specifications/frontend/routing.md:14-15` @ `ebbcdeb8d55b`

**模型給的摘錄**：- Article page (URL: `/article/article-slug-here` )
  - Delete article button (only shown to article's author)

**該檔原始行**

```
   14| - Article page (URL: `/article/article-slug-here` )
   15|   - Delete article button (only shown to article's author)
```

**核對器理由**：路由規範明確指出文章頁的 Delete article button 僅對文章作者顯示，非作者與未登入訪客皆不可見。


---

## P2-045 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.getByRole('link', { name: /Edit Article/i })).toHaveCount(0)`

**引用**：`specs/e2e/articles.spec.ts:282-303` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should only allow author to edit/delete article', async ({ page, browser }) => {
    const article = generateUniqueArticle();

    // Create article as first user
    await createArticle(page, article);

    // Get article URL
    const articleUrl = page.url();

    // Create a second user i

**該檔原始行**

```
  282|   test('should only allow author to edit/delete article', async ({ page, browser }) => {
  283|     const article = generateUniqueArticle();
  284| 
  285|     // Create article as first user
  286|     await createArticle(page, article);
  287| 
  288|     // Get article URL
  289|     const articleUrl = page.url();
  290| 
  291|     // Create a second user in new context (not sharing cookies with first user)
  292|     const context2 = await browser.newContext();
  293|     const page2 = await context2.newPage();
  294|     const user2 = generateUniqueUser();
  295|     await register(page2, user2.username, user2.email, user2.password);
  296| 
  297|     // Visit the article as second user
  298|     await page2.goto(articleUrl);
  299| 
  300|     // Should not see Edit/Delete buttons
  301|     await expect(page2.locator('a:has-text("Edit Article")')).not.toBeVisible();
  302|     await expect(page2.locator('button:has-text("Delete Article")')).not.toBeVisible();
  303| 
```

**核對器理由**：E2E 測試明確規範非文章作者訪問文章頁時不得看到「Edit Article」連結按鈕。


---

## P2-046 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.getByPlaceholder('Write a comment...')).toHaveCount(0)`

**引用**：`specs/e2e/comments.spec.ts:102-113` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should require login to post comment', async ({ page, browser }) => {
    // Create a new context without authentication (not sharing cookies with page)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    // Visit the article and wait for navigati

**該檔原始行**

```
  102|   test('should require login to post comment', async ({ page, browser }) => {
  103|     // Create a new context without authentication (not sharing cookies with page)
  104|     const context2 = await browser.newContext();
  105|     const page2 = await context2.newPage();
  106|     // Visit the article and wait for navigation
  107|     await page2.goto(page.url(), { waitUntil: 'load' });
  108|     // Wait for Angular to complete auth check - either comment form OR sign in link appears
  109|     await page2.waitForSelector('textarea[placeholder="Write a comment..."], a[href="/login"]', { timeout: 10000 });
  110|     // Should see sign in/sign up links instead of comment form
  111|     await expect(page2.locator('a[href="/login"]')).toBeVisible();
  112|     await expect(page2.locator('textarea[placeholder="Write a comment..."]')).not.toBeVisible();
  113|     await context2.close();
```

**核對器理由**：測試明確驗證了在未登入訪客訪問文章頁時，留言輸入框 textarea[placeholder="Write a comment..."] 不應可見。


---

## P2-047 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.getByRole('link', { name: 'Sign in' }).first()).toBeVisible()`

**引用**：`specs/e2e/comments.spec.ts:108-112` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Wait for Angular to complete auth check - either comment form OR sign in link appears
    await page2.waitForSelector('textarea[placeholder="Write a comment..."], a[href="/login"]', { timeout: 10000 });
    // Should see sign in/sign up links instead of comment form
    await expect(page2.loc

**該檔原始行**

```
  108|     // Wait for Angular to complete auth check - either comment form OR sign in link appears
  109|     await page2.waitForSelector('textarea[placeholder="Write a comment..."], a[href="/login"]', { timeout: 10000 });
  110|     // Should see sign in/sign up links instead of comment form
  111|     await expect(page2.locator('a[href="/login"]')).toBeVisible();
  112|     await expect(page2.locator('textarea[placeholder="Write a comment..."]')).not.toBeVisible();
```

**核對器理由**：E2E 測試明確驗證未登入訪客訪問文章頁面時，應看到導向登入（Sign in）的連結而不是留言表單。


---

## P2-048 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.locator('.ion-trash-a, .mod-options i, button i.ion-trash-a')).toHaveCount(0)`

**引用**：`docs/src/content/docs/specifications/frontend/routing.md:14-18` @ `ebbcdeb8d55b`

**模型給的摘錄**：- Article page (URL: `/article/article-slug-here` )
  - Delete article button (only shown to article's author)
  - Render markdown from server client side
  - Comments section at bottom of page
  - Delete comment button (only shown to comment's author)

**該檔原始行**

```
   14| - Article page (URL: `/article/article-slug-here` )
   15|   - Delete article button (only shown to article's author)
   16|   - Render markdown from server client side
   17|   - Comments section at bottom of page
   18|   - Delete comment button (only shown to comment's author)
```

**核對器理由**：規格明確規範文章頁的留言刪除按鈕僅對留言作者顯示，因此未登入訪客不應看到任何刪除按鈕。


---

## P2-049 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.getByText(authorCommentText)).toBeVisible()`

**引用**：`specs/e2e/comments.spec.ts:86-96` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should display multiple comments', async ({ page }) => {
    const comment1 = 'First comment';
    const comment2 = 'Second comment';
    const comment3 = 'Third comment';
    await addComment(page, comment1);
    await addComment(page, comment2);
    await addComment(page, comment3);
    //

**該檔原始行**

```
   86|   test('should display multiple comments', async ({ page }) => {
   87|     const comment1 = 'First comment';
   88|     const comment2 = 'Second comment';
   89|     const comment3 = 'Third comment';
   90|     await addComment(page, comment1);
   91|     await addComment(page, comment2);
   92|     await addComment(page, comment3);
   93|     // All comments should be visible (exclude comment form)
   94|     await expect(page.locator(`.card:not(.comment-form) .card-block:has-text("${comment1}")`)).toBeVisible();
   95|     await expect(page.locator(`.card:not(.comment-form) .card-block:has-text("${comment2}")`)).toBeVisible();
   96|     await expect(page.locator(`.card:not(.comment-form) .card-block:has-text("${comment3}")`)).toBeVisible();
```

**核對器理由**：公開 E2E 測試明文測試了在文章下有多則留言時，既有的每則留言內容都必須在頁面上保持可見。


---

## P2-050 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.getByText(readerCommentText)).toBeVisible()`

**引用**：`specs/e2e/comments.spec.ts:31-36` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should add a comment to an article', async ({ page }) => {
    const commentText = 'This is a test comment from Playwright!';
    await addComment(page, commentText);
    // Comment should be visible
    await expect(page.locator(`.card:not(.comment-form) .card-block:has-text("${commentText}

**該檔原始行**

```
   31|   test('should add a comment to an article', async ({ page }) => {
   32|     const commentText = 'This is a test comment from Playwright!';
   33|     await addComment(page, commentText);
   34|     // Comment should be visible
   35|     await expect(page.locator(`.card:not(.comment-form) .card-block:has-text("${commentText}")`)).toBeVisible();
   36|   });
```

**核對器理由**：官方 E2E 測試明確驗證了在文章頁發表留言後，該留言內容在頁面上必須可見。


---

## P2-051 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.getByRole('button', { name: /Delete Article/i })).toHaveCount(0)`

**引用**：`specs/e2e/articles.spec.ts:282-305` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should only allow author to edit/delete article', async ({ page, browser }) => {
    const article = generateUniqueArticle();

    // Create article as first user
    await createArticle(page, article);

    // Get article URL
    const articleUrl = page.url();

    // Create a second user i

**該檔原始行**

```
  282|   test('should only allow author to edit/delete article', async ({ page, browser }) => {
  283|     const article = generateUniqueArticle();
  284| 
  285|     // Create article as first user
  286|     await createArticle(page, article);
  287| 
  288|     // Get article URL
  289|     const articleUrl = page.url();
  290| 
  291|     // Create a second user in new context (not sharing cookies with first user)
  292|     const context2 = await browser.newContext();
  293|     const page2 = await context2.newPage();
  294|     const user2 = generateUniqueUser();
  295|     await register(page2, user2.username, user2.email, user2.password);
  296| 
  297|     // Visit the article as second user
  298|     await page2.goto(articleUrl);
  299| 
  300|     // Should not see Edit/Delete buttons
  301|     await expect(page2.locator('a:has-text("Edit Article")')).not.toBeVisible();
  302|     await expect(page2.locator('button:has-text("Delete Article")')).not.toBeVisible();
  303| 
  304|     await context2.close();
  305|   });
```

**核對器理由**：E2E 測試明確驗證非作者的已登入使用者在文章頁不應看到 Delete Article 按鈕。


---

## P2-052 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.getByRole('link', { name: /Edit Article/i })).toHaveCount(0)`

**引用**：`specs/e2e/articles.spec.ts:300-302` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Should not see Edit/Delete buttons
    await expect(page2.locator('a:has-text("Edit Article")')).not.toBeVisible();
    await expect(page2.locator('button:has-text("Delete Article")')).not.toBeVisible();

**該檔原始行**

```
  300|     // Should not see Edit/Delete buttons
  301|     await expect(page2.locator('a:has-text("Edit Article")')).not.toBeVisible();
  302|     await expect(page2.locator('button:has-text("Delete Article")')).not.toBeVisible();
```

**核對器理由**：E2E 測試明文驗證非文章作者的使用者瀏覽該文章頁面時，不應看見 Edit Article 連結。


---

## P2-053 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.getByRole('button', { name: /Follow/i }).first()).toBeVisible()`

**引用**：`specs/e2e/SELECTORS.md:120-120` @ `ebbcdeb8d55b`

**模型給的摘錄**：| `Follow` / `Unfollow`     | `button` | Profile, article meta    |

**該檔原始行**

```
  120| | `Follow` / `Unfollow`     | `button` | Profile, article meta    |
```

**核對器理由**：契約明確規定在文章頁的 article meta 區塊中，應有可見文字為 Follow/Unfollow 的按鈕供使用者操作。


---

## P2-054 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.getByRole('button', { name: /Favorite/i }).first()).toBeVisible()`

**引用**：`specs/e2e/articles.spec.ts:169-170` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Wait for article page to load - should see Favorite button (not Delete button)
    await page.waitForSelector('button:has-text("Favorite")', { timeout: 10000 });

**該檔原始行**

```
  169|     // Wait for article page to load - should see Favorite button (not Delete button)
  170|     await page.waitForSelector('button:has-text("Favorite")', { timeout: 10000 });
```

**核對器理由**：測試明確斷言當登入使用者檢視非自己撰寫的文章頁時，畫面上應可見 Favorite 按鈕而非 Delete 按鈕。


---

## P2-055 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(readerCommentCard.locator('.mod-options i, i.ion-trash-a')).toBeVisible()`

**引用**：`specs/e2e/comments.spec.ts:136-138` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Verify the delete button IS visible for OUR comment
    const ownComment = page.locator('.card', { has: page.locator(`text="${commentText}"`) });
    await expect(ownComment.locator('span.mod-options i.ion-trash-a')).toBeVisible();

**該檔原始行**

```
  136|     // Verify the delete button IS visible for OUR comment
  137|     const ownComment = page.locator('.card', { has: page.locator(`text="${commentText}"`) });
  138|     await expect(ownComment.locator('span.mod-options i.ion-trash-a')).toBeVisible();
```

**核對器理由**：官方 E2E 測試明確斷言使用者自己留下的留言卡片中，其刪除按鈕（span.mod-options i.ion-trash-a）必須可見。


---

## P2-056 · H02 · gemini-3.8-flash · concise

**斷言**：`await expect(authorCommentCard.locator('.mod-options i, i.ion-trash-a')).toHaveCount(0)`

**引用**：`docs/src/content/docs/specifications/frontend/routing.md:18-18` @ `ebbcdeb8d55b`

**模型給的摘錄**：   - Delete comment button (only shown to comment's author)

**該檔原始行**

```
   18|   - Delete comment button (only shown to comment's author)
```

**核對器理由**：規格明確規定留言的刪除按鈕僅顯示給該留言的作者，非作者的留言不可顯示刪除按鈕。


---

## P2-057 · H03 · gemini-3.8-flash · concise

**斷言**：`await expect(page.getByRole('button', { name: 'Global Feed' })).toHaveClass(/active/)`

**引用**：`specs/e2e/url-navigation.spec.ts:84-88` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Click Global Feed
    await page.click('.nav-link:has-text("Global Feed")');
    // Should navigate to /
    await expect(page).toHaveURL('/');
    await expect(page.locator('.nav-link:has-text("Global Feed")')).toHaveClass(/active/);

**該檔原始行**

```
   84|     await page.click('.nav-link:has-text("Global Feed")');
   85|     // Should navigate to /
   86|     await expect(page).toHaveURL('/');
   87|     await expect(page.locator('.nav-link:has-text("Global Feed")')).toHaveClass(/active/);
   88|   });
```

**核對器理由**：契約中明確測試了點擊 Global Feed 後，該分頁連結應帶有 active class。


---

## P2-058 · H03 · gemini-3.8-flash · concise

**斷言**：`await expect(currentPage2Btn).toBeVisible()`

**引用**：`specs/e2e/url-navigation.spec.ts:133-134` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Page 2 should be active
    await expect(page.locator('.pagination .page-item:has(.page-link:has-text("2"))')).toHaveClass(/active/);

**該檔原始行**

```
  133|     // Page 2 should be active
  134|     await expect(page.locator('.pagination .page-item:has(.page-link:has-text("2"))')).toHaveClass(/active/);
```

**核對器理由**：公開契約的 E2E 測試在切換至標籤分頁第 2 頁時，明確驗證了第 2 頁按鈕/項目處於當前作用（active/current）狀態並可見。


---

## P2-059 · H03 · gemini-3.8-flash · concise

**斷言**：`await expect(newPagePagination.getByRole('button', { name: /Page 2 is your current page|2/ })).toBeVisible()`

**引用**：`specs/e2e/url-navigation.spec.ts:150-154` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Go directly to page 2 of the tag
    await page.goto(`/tag/${uniqueTag}?page=2`);
    await page.waitForSelector('.article-preview', { timeout: 2000 });
    // Page 2 should be active
    await expect(page.locator('.pagination .page-item:has(.page-link:has-text("2"))')).toHaveClass(/active/);

**該檔原始行**

```
  150|     // Go directly to page 2 of the tag
  151|     await page.goto(`/tag/${uniqueTag}?page=2`);
  152|     await page.waitForSelector('.article-preview', { timeout: 2000 });
  153|     // Page 2 should be active
  154|     await expect(page.locator('.pagination .page-item:has(.page-link:has-text("2"))')).toHaveClass(/active/);
```

**核對器理由**：契約中明確測試直接導向標籤的第 2 頁網址（/tag/:tag?page=2）後，分頁元件上的第 2 頁按鈕/項目處於當前作用中狀態。


---

## P2-060 · H03 · gemini-3.8-flash · concise

**斷言**：`await expect(newPage.getByRole('button', { name: 'Global Feed' })).toHaveClass(/active/)`

**引用**：`specs/e2e/url-navigation.spec.ts:84-88` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Click Global Feed
    await page.click('.nav-link:has-text("Global Feed")');
    // Should navigate to /
    await expect(page).toHaveURL('/');
    await expect(page.locator('.nav-link:has-text("Global Feed")')).toHaveClass(/active/);

**該檔原始行**

```
   84|     await page.click('.nav-link:has-text("Global Feed")');
   85|     // Should navigate to /
   86|     await expect(page).toHaveURL('/');
   87|     await expect(page.locator('.nav-link:has-text("Global Feed")')).toHaveClass(/active/);
   88|   });
```

**核對器理由**：E2E 規格明確測試了點擊 Global Feed 頁籤切換後，Global Feed 連結/按鈕必須帶有 active class。


---

## P2-061 · S02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.locator('.error-messages')).toBeVisible()`

**引用**：`specs/e2e/error-handling.spec.ts:50-66` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should handle 400 on registration with validation errors', async ({ page }) => {
    await mockApiError(page, '/users', 400, {
      errors: {
        email: ['is already taken'],
        username: ['is too short (minimum is 3 characters)'],
      },
    });
    await page.goto('/register');

**該檔原始行**

```
   50|   test('should handle 400 on registration with validation errors', async ({ page }) => {
   51|     await mockApiError(page, '/users', 400, {
   52|       errors: {
   53|         email: ['is already taken'],
   54|         username: ['is too short (minimum is 3 characters)'],
   55|       },
   56|     });
   57|     await page.goto('/register');
   58|     await page.fill('input[name="username"]', 'ab');
   59|     await page.fill('input[name="email"]', 'taken@test.com');
   60|     await page.fill('input[name="password"]', 'password123');
   61|     await page.click('button[type="submit"]');
   62|     // Should show error messages
   63|     await expect(page.locator('.error-messages')).toBeVisible();
   64|     await expect(page).toHaveURL('/register');
   65|     await expect(page.locator('input[name="email"]')).toBeVisible();
   66|   });
```

**核對器理由**：E2E 測試明確驗證註冊遭遇 email 已被佔用等錯誤時，畫面上會顯示 .error-messages 錯誤訊息。


---

## P2-062 · S02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.locator('.error-messages')).toBeVisible()`

**引用**：`specs/e2e/error-handling.spec.ts:50-66` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should handle 400 on registration with validation errors', async ({ page }) => {
    await mockApiError(page, '/users', 400, {
      errors: {
        email: ['is already taken'],
        username: ['is too short (minimum is 3 characters)'],
      },
    });
    await page.goto('/register');

**該檔原始行**

```
   50|   test('should handle 400 on registration with validation errors', async ({ page }) => {
   51|     await mockApiError(page, '/users', 400, {
   52|       errors: {
   53|         email: ['is already taken'],
   54|         username: ['is too short (minimum is 3 characters)'],
   55|       },
   56|     });
   57|     await page.goto('/register');
   58|     await page.fill('input[name="username"]', 'ab');
   59|     await page.fill('input[name="email"]', 'taken@test.com');
   60|     await page.fill('input[name="password"]', 'password123');
   61|     await page.click('button[type="submit"]');
   62|     // Should show error messages
   63|     await expect(page.locator('.error-messages')).toBeVisible();
   64|     await expect(page).toHaveURL('/register');
   65|     await expect(page.locator('input[name="email"]')).toBeVisible();
   66|   });
```

**核對器理由**：契約中的 E2E 測試明確驗證在註冊失敗（包含 email 已經被使用）時，頁面上必須出現 .error-messages 錯誤訊息。


---

## P2-063 · S02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.locator('.error-messages')).toContainText(/email/i)`

**引用**：`specs/e2e/error-handling.spec.ts:50-66` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should handle 400 on registration with validation errors', async ({ page }) => {
    await mockApiError(page, '/users', 400, {
      errors: {
        email: ['is already taken'],
        username: ['is too short (minimum is 3 characters)'],
      },
    });
    await page.goto('/register');

**該檔原始行**

```
   50|   test('should handle 400 on registration with validation errors', async ({ page }) => {
   51|     await mockApiError(page, '/users', 400, {
   52|       errors: {
   53|         email: ['is already taken'],
   54|         username: ['is too short (minimum is 3 characters)'],
   55|       },
   56|     });
   57|     await page.goto('/register');
   58|     await page.fill('input[name="username"]', 'ab');
   59|     await page.fill('input[name="email"]', 'taken@test.com');
   60|     await page.fill('input[name="password"]', 'password123');
   61|     await page.click('button[type="submit"]');
   62|     // Should show error messages
   63|     await expect(page.locator('.error-messages')).toBeVisible();
   64|     await expect(page).toHaveURL('/register');
   65|     await expect(page.locator('input[name="email"]')).toBeVisible();
   66|   });
```

**核對器理由**：公開 E2E 規格中註冊失敗時的測試與範本（包含 template 中的 That email is already taken）明確規範了在註冊頁提交重複/錯誤 email 時 .error-messages 應顯示相關錯誤訊息，但未強制規定前端 .error-messages 必須包含 /email/i 字樣。


---

## P2-064 · S02 · gemini-3.8-flash · concise

**斷言**：`await expect(page).toHaveURL(/.*#\/register/)`

**引用**：`specs/e2e/error-handling.spec.ts:61-64` @ `ebbcdeb8d55b`

**模型給的摘錄**：    await page.click('button[type="submit"]');
    // Should show error messages
    await expect(page.locator('.error-messages')).toBeVisible();
    await expect(page).toHaveURL('/register');

**該檔原始行**

```
   61|     await page.click('button[type="submit"]');
   62|     // Should show error messages
   63|     await expect(page.locator('.error-messages')).toBeVisible();
   64|     await expect(page).toHaveURL('/register');
```

**核對器理由**：公開材料中的 E2E 測試明確驗證了註冊失敗（包括 email is already taken）時，頁面應留在註冊頁 URL（/register）不導頁。


---

## P2-065 · S02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.locator('.error-messages, [role="alert"]')).toBeVisible()`

**引用**：`specs/e2e/error-handling.spec.ts:50-66` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should handle 400 on registration with validation errors', async ({ page }) => {
    await mockApiError(page, '/users', 400, {
      errors: {
        email: ['is already taken'],
        username: ['is too short (minimum is 3 characters)'],
      },
    });
    await page.goto('/register');

**該檔原始行**

```
   50|   test('should handle 400 on registration with validation errors', async ({ page }) => {
   51|     await mockApiError(page, '/users', 400, {
   52|       errors: {
   53|         email: ['is already taken'],
   54|         username: ['is too short (minimum is 3 characters)'],
   55|       },
   56|     });
   57|     await page.goto('/register');
   58|     await page.fill('input[name="username"]', 'ab');
   59|     await page.fill('input[name="email"]', 'taken@test.com');
   60|     await page.fill('input[name="password"]', 'password123');
   61|     await page.click('button[type="submit"]');
   62|     // Should show error messages
   63|     await expect(page.locator('.error-messages')).toBeVisible();
   64|     await expect(page).toHaveURL('/register');
   65|     await expect(page.locator('input[name="email"]')).toBeVisible();
   66|   });
```

**核對器理由**：E2E 規格中明確測試註冊時發生 email taken 等驗證錯誤時，頁面上的 .error-messages 必須可見。


---

## P2-066 · S02 · gemini-3.8-flash · concise

**斷言**：`await expect(page.locator('.error-messages, [role="alert"]')).toContainText(/email.*has already been taken|email.*taken|already taken/i)`

**引用**：`specs/e2e/error-handling.spec.ts:50-66` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should handle 400 on registration with validation errors', async ({ page }) => {
    await mockApiError(page, '/users', 400, {
      errors: {
        email: ['is already taken'],
        username: ['is too short (minimum is 3 characters)'],
      },
    });
    await page.goto('/register');

**該檔原始行**

```
   50|   test('should handle 400 on registration with validation errors', async ({ page }) => {
   51|     await mockApiError(page, '/users', 400, {
   52|       errors: {
   53|         email: ['is already taken'],
   54|         username: ['is too short (minimum is 3 characters)'],
   55|       },
   56|     });
   57|     await page.goto('/register');
   58|     await page.fill('input[name="username"]', 'ab');
   59|     await page.fill('input[name="email"]', 'taken@test.com');
   60|     await page.fill('input[name="password"]', 'password123');
   61|     await page.click('button[type="submit"]');
   62|     // Should show error messages
   63|     await expect(page.locator('.error-messages')).toBeVisible();
   64|     await expect(page).toHaveURL('/register');
   65|     await expect(page.locator('input[name="email"]')).toBeVisible();
   66|   });
```

**核對器理由**：E2E 測試驗證了在註冊時若 email 被佔用（'is already taken'），頁面上會顯示 .error-messages 錯誤訊息。


---

## P2-067 · H01 · gpt-5.6-terra · precise

**斷言**：`await expect(page).toHaveURL(/#\/article\//); await expect(page.getByRole('heading', { name: originalTitle })).toBeVisible(); await expect(page.getByText(body)).toBeVisible(); for (const tag of tags) { await expect(page.getByText(tag, { exact: true })).toBeVisible(); } await page.getByRole('button', { name: 'Edit Article' }).click(); await expect(page).toHaveURL(/#\/editor\//); await page.getByPlaceholder('Article Title').fill(updatedTitle); const removeTagButtons = page.locator('.tag-list i'); while (await removeTagButtons.count()) { await removeTagButtons.first().click(); } await page.getByRole('button', { name: 'Publish Article' }).click(); await expect(page).toHaveURL(/#\/article\//); await expect(page.getByRole('heading', { name: updatedTitle })).toBeVisible(); await expect(page.getByRole('heading', { name: originalTitle })).not.toBeVisible(); for (const tag of tags) { await expect(page.getByText(tag, { exact: true })).not.toBeVisible(); } }); });`

**引用**：`specs/e2e/articles.spec.ts:38-39` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Should be on article page
    await expect(page).toHaveURL(/\/article\/.+/);

**該檔原始行**

```
   38|     await expect(page).toHaveURL(/\/article\/.+/);
   39| 
```

**核對器理由**：公開的 E2E 測試在發佈文章後明確驗證了瀏覽器 URL 導向至文章詳細頁（/article/...）。


---

## P2-068 · H02 · gpt-5.6-terra · precise

**斷言**：`await expect(page.getByText(authorCommentBody)).toBeVisible()`

**引用**：`docs/src/content/docs/specifications/frontend/routing.md:14-18` @ `ebbcdeb8d55b`

**模型給的摘錄**：- Article page (URL: `/article/article-slug-here` )
  - Delete article button (only shown to article's author)
  - Render markdown from server client side
  - Comments section at bottom of page
  - Delete comment button (only shown to comment's author)

**該檔原始行**

```
   14| - Article page (URL: `/article/article-slug-here` )
   15|   - Delete article button (only shown to article's author)
   16|   - Render markdown from server client side
   17|   - Comments section at bottom of page
   18|   - Delete comment button (only shown to comment's author)
```

**核對器理由**：規格明確規範文章頁（Article page）包含留言區塊（Comments section at bottom of page），訪客進入文章頁可看見已存在的留言。


---

## P2-069 · H02 · gpt-5.6-terra · precise

**斷言**：`await expect( page.getByText('Comment written by the article author'), ).toBeVisible()`

**引用**：`docs/src/content/docs/specifications/frontend/routing.md:14-17` @ `ebbcdeb8d55b`

**模型給的摘錄**：- Article page (URL: `/article/article-slug-here` )
  - Delete article button (only shown to article's author)
  - Render markdown from server client side
  - Comments section at bottom of page

**該檔原始行**

```
   14| - Article page (URL: `/article/article-slug-here` )
   15|   - Delete article button (only shown to article's author)
   16|   - Render markdown from server client side
   17|   - Comments section at bottom of page
```

**核對器理由**：前端路由規範明確規定文章頁（/article/:slug）底部包含留言區塊（Comments section），因此訪客訪問文章頁時先前留下的留言內容應可見。


---

## P2-070 · H02 · gpt-5.6-terra · precise

**斷言**：`await expect( page.getByRole('button', { name: /delete article/i }), ).not.toBeVisible()`

**引用**：`docs/src/content/docs/specifications/frontend/routing.md:14-15` @ `ebbcdeb8d55b`

**模型給的摘錄**：- Article page (URL: `/article/article-slug-here` )
  - Delete article button (only shown to article's author)

**該檔原始行**

```
   14| - Article page (URL: `/article/article-slug-here` )
   15|   - Delete article button (only shown to article's author)
```

**核對器理由**：規格明確規範文章頁的 Delete article button 僅在身分為文章作者時顯示，因此非作者（包含未登入訪客）不得看見該按鈕。


---

## P2-071 · H02 · gpt-5.6-terra · precise

**斷言**：`await expect(visitorComment).toBeVisible()`

**引用**：`specs/e2e/comments.spec.ts:31-36` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should add a comment to an article', async ({ page }) => {
    const commentText = 'This is a test comment from Playwright!';
    await addComment(page, commentText);
    // Comment should be visible
    await expect(page.locator(`.card:not(.comment-form) .card-block:has-text("${commentText}

**該檔原始行**

```
   31|   test('should add a comment to an article', async ({ page }) => {
   32|     const commentText = 'This is a test comment from Playwright!';
   33|     await addComment(page, commentText);
   34|     // Comment should be visible
   35|     await expect(page.locator(`.card:not(.comment-form) .card-block:has-text("${commentText}")`)).toBeVisible();
   36|   });
```

**核對器理由**：E2E 測試明確驗證了在文章發布留言後，該則留言卡片內容在頁面上可見。


---

## P2-072 · H02 · gpt-5.6-terra · precise

**斷言**：`await expect(page.getByText(authorCommentBody)).toBeVisible()`

**引用**：`specs/e2e/comments.spec.ts:102-113` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should require login to post comment', async ({ page, browser }) => {
    // Create a new context without authentication (not sharing cookies with page)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    // Visit the article and wait for navigati

**該檔原始行**

```
  102|   test('should require login to post comment', async ({ page, browser }) => {
  103|     // Create a new context without authentication (not sharing cookies with page)
  104|     const context2 = await browser.newContext();
  105|     const page2 = await context2.newPage();
  106|     // Visit the article and wait for navigation
  107|     await page2.goto(page.url(), { waitUntil: 'load' });
  108|     // Wait for Angular to complete auth check - either comment form OR sign in link appears
  109|     await page2.waitForSelector('textarea[placeholder="Write a comment..."], a[href="/login"]', { timeout: 10000 });
  110|     // Should see sign in/sign up links instead of comment form
  111|     await expect(page2.locator('a[href="/login"]')).toBeVisible();
  112|     await expect(page2.locator('textarea[placeholder="Write a comment..."]')).not.toBeVisible();
  113|     await context2.close();
```

**核對器理由**：公開測試中訪客訪問文章頁只驗證未登入連結與沒有留言框，未對既有留言內容的能見度做斷言。


---

## P2-073 · H03 · gpt-5.6-terra · precise

**斷言**：`await expect(page).toHaveURL(new RegExp(`${UI.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/#/?$`))`

**引用**：`specs/e2e/url-navigation.spec.ts:227-229` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Click Global Feed and wait for URL to change to root path
    await page.click('.nav-link:has-text("Global Feed")');
    await expect(page).toHaveURL('/');

**該檔原始行**

```
  227|     // Click Global Feed and wait for URL to change to root path
  228|     await page.click('.nav-link:has-text("Global Feed")');
  229|     await expect(page).toHaveURL('/');
```

**核對器理由**：契約中的 E2E 測試明確驗證了在標籤分頁（page 2）狀態下點擊 Global Feed 切回全部文章時，URL 應變更回根路徑（'/'）。


---

## P2-074 · H03 · gpt-5.6-terra · precise

**斷言**：`await expect(articlePreviews).toHaveCount(5)`

**引用**：`specs/e2e/url-navigation.spec.ts:266-268` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Second page should have 5 articles (15 - 10 = 5)
    const articlesOnPage2 = await page.locator('.article-preview').count();
    expect(articlesOnPage2).toBe(5);

**該檔原始行**

```
  266|     // Second page should have 5 articles (15 - 10 = 5)
  267|     const articlesOnPage2 = await page.locator('.article-preview').count();
  268|     expect(articlesOnPage2).toBe(5);
```

**核對器理由**：E2E 測試在 15 篇帶有特定標籤的文章情境下，明確測試了點選第 2 頁後應該顯示剩餘的 5 篇 article-preview。


---

## P2-075 · S02 · gpt-5.6-terra · precise

**斷言**：`await expect(error).toContainText(/email.*already|already.*email|taken/i)`

**引用**：`specs/e2e/error-handling.spec.ts:50-66` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should handle 400 on registration with validation errors', async ({ page }) => {
    await mockApiError(page, '/users', 400, {
      errors: {
        email: ['is already taken'],
        username: ['is too short (minimum is 3 characters)'],
      },
    });
    await page.goto('/register');

**該檔原始行**

```
   50|   test('should handle 400 on registration with validation errors', async ({ page }) => {
   51|     await mockApiError(page, '/users', 400, {
   52|       errors: {
   53|         email: ['is already taken'],
   54|         username: ['is too short (minimum is 3 characters)'],
   55|       },
   56|     });
   57|     await page.goto('/register');
   58|     await page.fill('input[name="username"]', 'ab');
   59|     await page.fill('input[name="email"]', 'taken@test.com');
   60|     await page.fill('input[name="password"]', 'password123');
   61|     await page.click('button[type="submit"]');
   62|     // Should show error messages
   63|     await expect(page.locator('.error-messages')).toBeVisible();
   64|     await expect(page).toHaveURL('/register');
   65|     await expect(page.locator('input[name="email"]')).toBeVisible();
   66|   });
```

**核對器理由**：契約中 templates.md (267-269行) 與 error-handling.spec.ts (50-66行) 明確定義並測試註冊時 email 重複錯誤在 .error-messages 內顯示 'That email is already taken' / email 'is already taken'。


---

## P2-076 · S02 · gpt-5.6-terra · precise

**斷言**：`await expect(page).toHaveURL(/#\/register$/)`

**引用**：`specs/e2e/error-handling.spec.ts:62-65` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Should show error messages
    await expect(page.locator('.error-messages')).toBeVisible();
    await expect(page).toHaveURL('/register');
    await expect(page.locator('input[name="email"]')).toBeVisible();

**該檔原始行**

```
   62|     // Should show error messages
   63|     await expect(page.locator('.error-messages')).toBeVisible();
   64|     await expect(page).toHaveURL('/register');
   65|     await expect(page.locator('input[name="email"]')).toBeVisible();
```

**核對器理由**：公開契約的 E2E 測試明確斷言註冊失敗時頁面應維持停留在註冊頁面路由（toHaveURL('/register')）。


---

## P2-077 · S02 · gpt-5.6-terra · precise

**斷言**：`await expect(page).toHaveURL(/#\/register$/)`

**引用**：`specs/e2e/error-handling.spec.ts:63-65` @ `ebbcdeb8d55b`

**模型給的摘錄**：    await expect(page.locator('.error-messages')).toBeVisible();
    await expect(page).toHaveURL('/register');
    await expect(page.locator('input[name="email"]')).toBeVisible();

**該檔原始行**

```
   63|     await expect(page.locator('.error-messages')).toBeVisible();
   64|     await expect(page).toHaveURL('/register');
   65|     await expect(page.locator('input[name="email"]')).toBeVisible();
```

**核對器理由**：官方 E2E 測試在註冊發生驗證錯誤（包含 email 被佔用）時，明確斷言頁面 URL 應維持在註冊頁（/register）。


---

## P2-078 · S02 · gpt-5.6-terra · precise

**斷言**：`await expect(page).toHaveURL(/#\/register/)`

**引用**：`specs/e2e/error-handling.spec.ts:62-65` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Should show error messages
    await expect(page.locator('.error-messages')).toBeVisible();
    await expect(page).toHaveURL('/register');
    await expect(page.locator('input[name="email"]')).toBeVisible();

**該檔原始行**

```
   62|     // Should show error messages
   63|     await expect(page.locator('.error-messages')).toBeVisible();
   64|     await expect(page).toHaveURL('/register');
   65|     await expect(page.locator('input[name="email"]')).toBeVisible();
```

**核對器理由**：E2E 測試明確斷言當註冊因 email 重複等驗證錯誤失敗時，頁面 URL 應維持在註冊頁（/register）。


---

## P2-079 · S02 · gpt-5.6-terra · precise

**斷言**：`await expect(page.locator('.error-messages')).toContainText(/email.*already|already.*email/i)`

**引用**：`specs/e2e/error-handling.spec.ts:50-64` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should handle 400 on registration with validation errors', async ({ page }) => {
    await mockApiError(page, '/users', 400, {
      errors: {
        email: ['is already taken'],
        username: ['is too short (minimum is 3 characters)'],
      },
    });
    await page.goto('/register');

**該檔原始行**

```
   50|   test('should handle 400 on registration with validation errors', async ({ page }) => {
   51|     await mockApiError(page, '/users', 400, {
   52|       errors: {
   53|         email: ['is already taken'],
   54|         username: ['is too short (minimum is 3 characters)'],
   55|       },
   56|     });
   57|     await page.goto('/register');
   58|     await page.fill('input[name="username"]', 'ab');
   59|     await page.fill('input[name="email"]', 'taken@test.com');
   60|     await page.fill('input[name="password"]', 'password123');
   61|     await page.click('button[type="submit"]');
   62|     // Should show error messages
   63|     await expect(page.locator('.error-messages')).toBeVisible();
   64|     await expect(page).toHaveURL('/register');
```

**核對器理由**：契約中已測冊重複 email 註冊時 API 回傳 email 'is already taken' 錯誤並由頁面的 .error-messages 顯示，且 templates.md 也明訂了該錯誤文字範例。


---

## P2-080 · S07 · gpt-5.6-terra · precise

**斷言**：`await expect(page).toHaveURL(new RegExp(`${UI.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/#/?$`))`

**引用**：`specs/e2e/articles.spec.ts:76-81` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Delete the article
    await deleteArticle(page);

    // Should be redirected to home
    await expect(page).toHaveURL('/');

**該檔原始行**

```
   76|     // Delete the article
   77|     await deleteArticle(page);
   78| 
   79|     // Should be redirected to home
   80|     await expect(page).toHaveURL('/');
   81| 
```

**核對器理由**：E2E 測試明確要求並測試在刪除文章後，使用者必須被重新導向回首頁（/）。


---

## P2-081 · S07 · gpt-5.6-terra · precise

**斷言**：`await expect(page).toHaveURL(new RegExp(`${UI.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/#/?$`))`

**引用**：`specs/e2e/articles.spec.ts:76-80` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Delete the article
    await deleteArticle(page);

    // Should be redirected to home
    await expect(page).toHaveURL('/');

**該檔原始行**

```
   76|     // Delete the article
   77|     await deleteArticle(page);
   78| 
   79|     // Should be redirected to home
   80|     await expect(page).toHaveURL('/');
```

**核對器理由**：公開的 E2E 測試明確斷言刪除文章後應重定向至首頁（'/'）。


---

## P2-082 · S07 · gpt-5.6-terra · precise

**斷言**：`await expect(page).toHaveURL(new RegExp(`${UI.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/#/?$`))`

**引用**：`specs/e2e/articles.spec.ts:76-81` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Delete the article
    await deleteArticle(page);

    // Should be redirected to home
    await expect(page).toHaveURL('/');

**該檔原始行**

```
   76|     // Delete the article
   77|     await deleteArticle(page);
   78| 
   79|     // Should be redirected to home
   80|     await expect(page).toHaveURL('/');
   81| 
```

**核對器理由**：官方 E2E 測試明確斷言在刪除文章後，頁面應重定向至首頁（'/'）。


---

## P2-083 · S12 · gpt-5.6-terra · precise

**斷言**：`await expect(page.locator('.pagination .page-item.active')).toHaveText('2')`

**引用**：`specs/e2e/SELECTORS.md:213-213` @ `ebbcdeb8d55b`

**模型給的摘錄**：- **Pagination active**: The current page's `.page-item` has the CSS class `active`.

**該檔原始行**

```
  213| - **Pagination active**: The current page's `.page-item` has the CSS class `active`.
```

**核對器理由**：契約明確規定當前分頁的 .page-item 元素必須具備 active CSS 類別，支持換到第 2 頁後該頁碼項目成為 active 的斷言。


---

## P2-084 · S12 · gpt-5.6-terra · precise

**斷言**：`await expect(page).toHaveURL(/[#?&]page=2|offset=10/)`

**引用**：`specs/e2e/SELECTORS.md:147-147` @ `ebbcdeb8d55b`

**模型給的摘錄**：| `/?page=N`                     | Paginated feed            |

**該檔原始行**

```
  147| | `/?page=N`                     | Paginated feed            |
```

**核對器理由**：SELECTORS.md 明確規定分頁列表的頁面路由格式包含 ?page=N。


---

## P2-085 · H02 · gpt-5.6-terra · concise

**斷言**：`await expect(page.getByText(article.title, { exact: true })).toBeVisible()`

**引用**：`specs/e2e/articles.spec.ts:37-41` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Should be on article page
    await expect(page).toHaveURL(/\/article\/.+/);

    // Should show article content
    await expect(page.locator('h1')).toHaveText(article.title);

**該檔原始行**

```
   37|     // Should be on article page
   38|     await expect(page).toHaveURL(/\/article\/.+/);
   39| 
   40|     // Should show article content
   41|     await expect(page.locator('h1')).toHaveText(article.title);
```

**核對器理由**：E2E 規格明確斷言進入文章頁面後，應顯示該文章的標題（article.title）。


---

## P2-086 · H02 · gpt-5.6-terra · concise

**斷言**：`await expect(page.getByText(author.username, { exact: true }).first()).toBeVisible()`

**引用**：`docs/src/content/docs/specifications/frontend/templates.md:490-495` @ `ebbcdeb8d55b`

**模型給的摘錄**：        <div class="article-meta">
          <a href="/profile/eric-simons"><img src="http://i.imgur.com/Qr71crq.jpg" /></a>
          <div class="info">
            <a href="/profile/eric-simons" class="author">Eric Simons</a>
            <span class="date">January 20th</span>
          </div>

**該檔原始行**

```
  490|       <div class="article-meta">
  491|         <a href="/profile/eric-simons"><img src="http://i.imgur.com/Qr71crq.jpg" /></a>
  492|         <div class="info">
  493|           <a href="/profile/eric-simons" class="author">Eric Simons</a>
  494|           <span class="date">January 20th</span>
  495|         </div>
```

**核對器理由**：規格範本明確規定文章頁（Article page）的 article-meta 區域應包含作者名稱（author username）連結與文字展示。


---

## P2-087 · H02 · gpt-5.6-terra · concise

**斷言**：`await expect(page.getByText(authorComment, { exact: true })).toBeVisible()`

**引用**：`specs/e2e/comments.spec.ts:31-36` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should add a comment to an article', async ({ page }) => {
    const commentText = 'This is a test comment from Playwright!';
    await addComment(page, commentText);
    // Comment should be visible
    await expect(page.locator(`.card:not(.comment-form) .card-block:has-text("${commentText}

**該檔原始行**

```
   31|   test('should add a comment to an article', async ({ page }) => {
   32|     const commentText = 'This is a test comment from Playwright!';
   33|     await addComment(page, commentText);
   34|     // Comment should be visible
   35|     await expect(page.locator(`.card:not(.comment-form) .card-block:has-text("${commentText}")`)).toBeVisible();
   36|   });
```

**核對器理由**：官方 E2E 測試明確驗證文章頁上發布的留言內容必須在畫面上可見（toBeVisible）。


---

## P2-088 · H02 · gpt-5.6-terra · concise

**斷言**：`await expect( page.getByRole('button', { name: /delete article/i }), ).toHaveCount(0)`

**引用**：`docs/src/content/docs/specifications/frontend/routing.md:14-15` @ `ebbcdeb8d55b`

**模型給的摘錄**：- Article page (URL: `/article/article-slug-here` )
  - Delete article button (only shown to article's author)

**該檔原始行**

```
   14| - Article page (URL: `/article/article-slug-here` )
   15|   - Delete article button (only shown to article's author)
```

**核對器理由**：規格明確規定文章頁的刪除文章按鈕僅對文章作者顯示，非作者或未登入訪客不應看到該按鈕。


---

## P2-089 · H02 · gpt-5.6-terra · concise

**斷言**：`await expect( page.getByRole('link', { name: /edit article/i }), ).toHaveCount(0)`

**引用**：`specs/e2e/articles.spec.ts:300-302` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Should not see Edit/Delete buttons
    await expect(page2.locator('a:has-text("Edit Article")')).not.toBeVisible();
    await expect(page2.locator('button:has-text("Delete Article")')).not.toBeVisible();

**該檔原始行**

```
  300|     // Should not see Edit/Delete buttons
  301|     await expect(page2.locator('a:has-text("Edit Article")')).not.toBeVisible();
  302|     await expect(page2.locator('button:has-text("Delete Article")')).not.toBeVisible();
```

**核對器理由**：E2E 測試明確斷言非作者的使用者造訪文章頁面時，不可看見 Edit Article 連結。


---

## P2-090 · H02 · gpt-5.6-terra · concise

**斷言**：`await expect( page.getByRole('button', { name: /delete comment/i }), ).toHaveCount(0)`

**引用**：`docs/src/content/docs/specifications/frontend/routing.md:18-18` @ `ebbcdeb8d55b`

**模型給的摘錄**：   - Delete comment button (only shown to comment's author)

**該檔原始行**

```
   18|   - Delete comment button (only shown to comment's author)
```

**核對器理由**：規格明確規範文章頁上的刪除留言按鈕僅對留言作者顯示，因此訪客或非作者看不到刪除按鈕。


---

## P2-091 · H02 · gpt-5.6-terra · concise

**斷言**：`await expect( page.getByPlaceholder(/write a comment/i), ).toHaveCount(0)`

**引用**：`specs/e2e/comments.spec.ts:102-113` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should require login to post comment', async ({ page, browser }) => {
    // Create a new context without authentication (not sharing cookies with page)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    // Visit the article and wait for navigati

**該檔原始行**

```
  102|   test('should require login to post comment', async ({ page, browser }) => {
  103|     // Create a new context without authentication (not sharing cookies with page)
  104|     const context2 = await browser.newContext();
  105|     const page2 = await context2.newPage();
  106|     // Visit the article and wait for navigation
  107|     await page2.goto(page.url(), { waitUntil: 'load' });
  108|     // Wait for Angular to complete auth check - either comment form OR sign in link appears
  109|     await page2.waitForSelector('textarea[placeholder="Write a comment..."], a[href="/login"]', { timeout: 10000 });
  110|     // Should see sign in/sign up links instead of comment form
  111|     await expect(page2.locator('a[href="/login"]')).toBeVisible();
  112|     await expect(page2.locator('textarea[placeholder="Write a comment..."]')).not.toBeVisible();
  113|     await context2.close();
```

**核對器理由**：E2E 測試明確驗證未登入訪客造訪文章頁時不應看見留言輸入框 textarea[placeholder="Write a comment..."]。


---

## P2-092 · H02 · gpt-5.6-terra · concise

**斷言**：`await expect(page.getByText(authorComment, { exact: true })).toBeVisible()`

**引用**：`specs/e2e/comments.spec.ts:133-138` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Now add our own comment
    const commentText = `Comment by logged in user ${Date.now()}`;
    await addComment(page, commentText);
    // Verify the delete button IS visible for OUR comment
    const ownComment = page.locator('.card', { has: page.locator(`text="${commentText}"`) });
    awai

**該檔原始行**

```
  133|     // Now add our own comment
  134|     const commentText = `Comment by logged in user ${Date.now()}`;
  135|     await addComment(page, commentText);
  136|     // Verify the delete button IS visible for OUR comment
  137|     const ownComment = page.locator('.card', { has: page.locator(`text="${commentText}"`) });
  138|     await expect(ownComment.locator('span.mod-options i.ion-trash-a')).toBeVisible();
```

**核對器理由**：公開測試在驗證非自己留言不可刪除時，明確測了登入使用者在文章頁上能看見其他作者既有的留言（及自己後續加入的留言）。


---

## P2-093 · H02 · gpt-5.6-terra · concise

**斷言**：`await expect( page.getByRole('button', { name: /delete article/i }), ).toHaveCount(0)`

**引用**：`specs/e2e/articles.spec.ts:300-303` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Should not see Edit/Delete buttons
    await expect(page2.locator('a:has-text("Edit Article")')).not.toBeVisible();
    await expect(page2.locator('button:has-text("Delete Article")')).not.toBeVisible();

**該檔原始行**

```
  300|     // Should not see Edit/Delete buttons
  301|     await expect(page2.locator('a:has-text("Edit Article")')).not.toBeVisible();
  302|     await expect(page2.locator('button:has-text("Delete Article")')).not.toBeVisible();
  303| 
```

**核對器理由**：E2E 測試明確斷言非作者使用者造訪文章頁時，不可看見 Delete Article 按鈕。


---

## P2-094 · H02 · gpt-5.6-terra · concise

**斷言**：`await expect( page.getByRole('link', { name: /edit article/i }), ).toHaveCount(0)`

**引用**：`specs/e2e/articles.spec.ts:300-302` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Should not see Edit/Delete buttons
    await expect(page2.locator('a:has-text("Edit Article")')).not.toBeVisible();
    await expect(page2.locator('button:has-text("Delete Article")')).not.toBeVisible();

**該檔原始行**

```
  300|     // Should not see Edit/Delete buttons
  301|     await expect(page2.locator('a:has-text("Edit Article")')).not.toBeVisible();
  302|     await expect(page2.locator('button:has-text("Delete Article")')).not.toBeVisible();
```

**核對器理由**：E2E 測試明確驗證非作者使用者訪問文章頁時不應看到 Edit Article 連結。


---

## P2-095 · H02 · gpt-5.6-terra · concise

**斷言**：`await expect( page.getByRole('button', { name: /delete comment/i }), ).toHaveCount(0)`

**引用**：`docs/src/content/docs/specifications/frontend/routing.md:17-18` @ `ebbcdeb8d55b`

**模型給的摘錄**：   - Comments section at bottom of page
   - Delete comment button (only shown to comment's author)

**該檔原始行**

```
   17|   - Comments section at bottom of page
   18|   - Delete comment button (only shown to comment's author)
```

**核對器理由**：規格明確規定文章頁上的刪除留言按鈕只顯示給留言作者，非作者看見該按鈕數量應為 0。


---

## P2-096 · H02 · gpt-5.6-terra · concise

**斷言**：`await expect(visitorCommentCard).toBeVisible()`

**引用**：`specs/e2e/comments.spec.ts:31-36` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should add a comment to an article', async ({ page }) => {
    const commentText = 'This is a test comment from Playwright!';
    await addComment(page, commentText);
    // Comment should be visible
    await expect(page.locator(`.card:not(.comment-form) .card-block:has-text("${commentText}

**該檔原始行**

```
   31|   test('should add a comment to an article', async ({ page }) => {
   32|     const commentText = 'This is a test comment from Playwright!';
   33|     await addComment(page, commentText);
   34|     // Comment should be visible
   35|     await expect(page.locator(`.card:not(.comment-form) .card-block:has-text("${commentText}")`)).toBeVisible();
   36|   });
```

**核對器理由**：E2E 測試明確測試了使用者在文章頁送出留言後，該留言卡片內容必須在畫面上可見（toBeVisible）。


---

## P2-097 · H02 · gpt-5.6-terra · concise

**斷言**：`await expect(authorCommentCard).toBeVisible()`

**引用**：`specs/e2e/comments.spec.ts:31-36` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should add a comment to an article', async ({ page }) => {
    const commentText = 'This is a test comment from Playwright!';
    await addComment(page, commentText);
    // Comment should be visible
    await expect(page.locator(`.card:not(.comment-form) .card-block:has-text("${commentText}

**該檔原始行**

```
   31|   test('should add a comment to an article', async ({ page }) => {
   32|     const commentText = 'This is a test comment from Playwright!';
   33|     await addComment(page, commentText);
   34|     // Comment should be visible
   35|     await expect(page.locator(`.card:not(.comment-form) .card-block:has-text("${commentText}")`)).toBeVisible();
   36|   });
```

**核對器理由**：公開的 E2E 測試明確測試並斷言文章下的留言卡片（.card 內容）必須對使用者可見。


---

## P2-098 · H02 · gpt-5.6-terra · concise

**斷言**：`await expect( authorCommentCard.getByRole('button', { name: /delete comment/i }), ).toHaveCount(0)`

**引用**：`docs/src/content/docs/specifications/frontend/routing.md:18-18` @ `ebbcdeb8d55b`

**模型給的摘錄**：   - Delete comment button (only shown to comment's author)

**該檔原始行**

```
   18|   - Delete comment button (only shown to comment's author)
```

**核對器理由**：規格明確規定文章頁上的刪除留言按鈕只會顯示給該留言的作者，因此非作者的使用者看到該留言時不應有刪除按鈕。


---

## P2-099 · H02 · gpt-5.6-terra · concise

**斷言**：`await expect(page.getByText(authorComment)).toBeVisible()`

**引用**：`specs/e2e/comments.spec.ts:102-107` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should require login to post comment', async ({ page, browser }) => {
    // Create a new context without authentication (not sharing cookies with page)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    // Visit the article and wait for navigati

**該檔原始行**

```
  102|   test('should require login to post comment', async ({ page, browser }) => {
  103|     // Create a new context without authentication (not sharing cookies with page)
  104|     const context2 = await browser.newContext();
  105|     const page2 = await context2.newPage();
  106|     // Visit the article and wait for navigation
  107|     await page2.goto(page.url(), { waitUntil: 'load' });
```

**核對器理由**：E2E 測試驗證未登入訪客（全新無憑證 context）開啟既有文章頁面，且前置條件與規格說明文章下的留言列表與內容對未登入訪客可見。


---

## P2-100 · H02 · gpt-5.6-terra · concise

**斷言**：`await expect( page.getByRole('button', { name: /edit article/i }), ).toHaveCount(0)`

**引用**：`specs/e2e/articles.spec.ts:282-303` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should only allow author to edit/delete article', async ({ page, browser }) => {
    const article = generateUniqueArticle();

    // Create article as first user
    await createArticle(page, article);

    // Get article URL
    const articleUrl = page.url();

    // Create a second user i

**該檔原始行**

```
  282|   test('should only allow author to edit/delete article', async ({ page, browser }) => {
  283|     const article = generateUniqueArticle();
  284| 
  285|     // Create article as first user
  286|     await createArticle(page, article);
  287| 
  288|     // Get article URL
  289|     const articleUrl = page.url();
  290| 
  291|     // Create a second user in new context (not sharing cookies with first user)
  292|     const context2 = await browser.newContext();
  293|     const page2 = await context2.newPage();
  294|     const user2 = generateUniqueUser();
  295|     await register(page2, user2.username, user2.email, user2.password);
  296| 
  297|     // Visit the article as second user
  298|     await page2.goto(articleUrl);
  299| 
  300|     // Should not see Edit/Delete buttons
  301|     await expect(page2.locator('a:has-text("Edit Article")')).not.toBeVisible();
  302|     await expect(page2.locator('button:has-text("Delete Article")')).not.toBeVisible();
  303| 
```

**核對器理由**：E2E 測試明確測試並規範了非作者訪問文章頁面時，不應看到 Edit Article 按鈕/連結。


---

## P2-101 · H02 · gpt-5.6-terra · concise

**斷言**：`await expect( page.getByRole('button', { name: /delete article/i }), ).toHaveCount(0)`

**引用**：`docs/src/content/docs/specifications/frontend/routing.md:14-15` @ `ebbcdeb8d55b`

**模型給的摘錄**：- Article page (URL: `/article/article-slug-here` )
  - Delete article button (only shown to article's author)

**該檔原始行**

```
   14| - Article page (URL: `/article/article-slug-here` )
   15|   - Delete article button (only shown to article's author)
```

**核對器理由**：前端路由規範明確規定文章頁上的「Delete article button」僅顯示給文章作者，未登入訪客不能看到該按鈕。


---

## P2-102 · H02 · gpt-5.6-terra · concise

**斷言**：`await expect( page.getByRole('button', { name: /delete comment/i }), ).toHaveCount(0)`

**引用**：`docs/src/content/docs/specifications/frontend/routing.md:18-18` @ `ebbcdeb8d55b`

**模型給的摘錄**：   - Delete comment button (only shown to comment's author)

**該檔原始行**

```
   18|   - Delete comment button (only shown to comment's author)
```

**核對器理由**：規格明確規範文章頁的刪除留言按鈕僅對該留言作者顯示，訪客或非留言作者不應看到該刪除按鈕。


---

## P2-103 · H02 · gpt-5.6-terra · concise

**斷言**：`await expect(page.getByText(authorComment)).toBeVisible()`

**引用**：`specs/e2e/comments.spec.ts:126-131` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Check if there are any existing comments (from other users like johndoe)
    const existingCommentsCount = await page.locator('.card:not(.comment-form)').count();
    // If there are existing comments, they should NOT have delete buttons (not our comments)
    if (existingCommentsCount > 0) {

**該檔原始行**

```
  126|     // Check if there are any existing comments (from other users like johndoe)
  127|     const existingCommentsCount = await page.locator('.card:not(.comment-form)').count();
  128|     // If there are existing comments, they should NOT have delete buttons (not our comments)
  129|     if (existingCommentsCount > 0) {
  130|       const firstExistingComment = page.locator('.card:not(.comment-form)').first();
  131|       await expect(firstExistingComment.locator('span.mod-options i.ion-trash-a')).not.toBeVisible();
```

**核對器理由**：測試明確驗證登入使用者在文章頁上可以看到其他使用者（非作者自身）既有的留言內容。


---

## P2-104 · H02 · gpt-5.6-terra · concise

**斷言**：`await expect( page.getByRole('button', { name: /edit article/i }), ).toHaveCount(0)`

**引用**：`specs/e2e/articles.spec.ts:297-303` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Visit the article as second user
    await page2.goto(articleUrl);

    // Should not see Edit/Delete buttons
    await expect(page2.locator('a:has-text("Edit Article")')).not.toBeVisible();
    await expect(page2.locator('button:has-text("Delete Article")')).not.toBeVisible();

**該檔原始行**

```
  297|     // Visit the article as second user
  298|     await page2.goto(articleUrl);
  299| 
  300|     // Should not see Edit/Delete buttons
  301|     await expect(page2.locator('a:has-text("Edit Article")')).not.toBeVisible();
  302|     await expect(page2.locator('button:has-text("Delete Article")')).not.toBeVisible();
  303| 
```

**核對器理由**：E2E 測試明確驗證了非作者使用者造訪文章頁面時，不應看到編輯文章按鈕（Edit Article）。


---

## P2-105 · H02 · gpt-5.6-terra · concise

**斷言**：`await expect( page.getByRole('button', { name: /delete article/i }), ).toHaveCount(0)`

**引用**：`docs/src/content/docs/specifications/frontend/routing.md:14-15` @ `ebbcdeb8d55b`

**模型給的摘錄**：- Article page (URL: `/article/article-slug-here` )
  - Delete article button (only shown to article's author)

**該檔原始行**

```
   14| - Article page (URL: `/article/article-slug-here` )
   15|   - Delete article button (only shown to article's author)
```

**核對器理由**：前端路由規範明確定義文章頁的刪除文章按鈕僅對文章作者顯示，非作者或未登入者皆不應看見。


---

## P2-106 · H02 · gpt-5.6-terra · concise

**斷言**：`await expect( page.getByRole('button', { name: /delete comment/i }), ).toHaveCount(0)`

**引用**：`docs/src/content/docs/specifications/frontend/routing.md:18-18` @ `ebbcdeb8d55b`

**模型給的摘錄**：- Delete comment button (only shown to comment's author)

**該檔原始行**

```
   18|   - Delete comment button (only shown to comment's author)
```

**核對器理由**：前端路由規格明確要求文章頁的刪除留言按鈕僅對該留言作者顯示，非作者不可見。


---

## P2-107 · H02 · gpt-5.6-terra · concise

**斷言**：`await expect( page.getByPlaceholder(/write a comment/i), ).toBeVisible()`

**引用**：`specs/e2e/comments.spec.ts:108-112` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Wait for Angular to complete auth check - either comment form OR sign in link appears
    await page2.waitForSelector('textarea[placeholder="Write a comment..."], a[href="/login"]', { timeout: 10000 });
    // Should see sign in/sign up links instead of comment form
    await expect(page2.loc

**該檔原始行**

```
  108|     // Wait for Angular to complete auth check - either comment form OR sign in link appears
  109|     await page2.waitForSelector('textarea[placeholder="Write a comment..."], a[href="/login"]', { timeout: 10000 });
  110|     // Should see sign in/sign up links instead of comment form
  111|     await expect(page2.locator('a[href="/login"]')).toBeVisible();
  112|     await expect(page2.locator('textarea[placeholder="Write a comment..."]')).not.toBeVisible();
```

**核對器理由**：測試明確斷言未登入使用者在文章頁看不到 placeholder 為 'Write a comment...' 的留言輸入框，相反地已登入使用者應可見此輸入框。


---

## P2-108 · H02 · gpt-5.6-terra · concise

**斷言**：`await expect( page.getByRole('button', { name: /post comment/i }), ).toBeVisible()`

**引用**：`specs/e2e/SELECTORS.md:113-115` @ `ebbcdeb8d55b`

**模型給的摘錄**：| Text                      | Element  | Context                  |
| ------------------------- | -------- | ------------------------ |
| `Post Comment`            | `button` | Article detail           |

**該檔原始行**

```
  113| | Text                      | Element  | Context                  |
  114| | ------------------------- | -------- | ------------------------ |
  115| | `Post Comment`            | `button` | Article detail           |
```

**核對器理由**：SELECTORS.md 明確規定在文章詳情頁（Article detail）存在按鈕文字為「Post Comment」的 button 元素。


---

## P2-109 · H02 · gpt-5.6-terra · concise

**斷言**：`await expect(otherCommentCard).toBeVisible()`

**引用**：`specs/e2e/comments.spec.ts:31-36` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should add a comment to an article', async ({ page }) => {
    const commentText = 'This is a test comment from Playwright!';
    await addComment(page, commentText);
    // Comment should be visible
    await expect(page.locator(`.card:not(.comment-form) .card-block:has-text("${commentText}

**該檔原始行**

```
   31|   test('should add a comment to an article', async ({ page }) => {
   32|     const commentText = 'This is a test comment from Playwright!';
   33|     await addComment(page, commentText);
   34|     // Comment should be visible
   35|     await expect(page.locator(`.card:not(.comment-form) .card-block:has-text("${commentText}")`)).toBeVisible();
   36|   });
```

**核對器理由**：官方 E2E 測試明確驗證了在文章頁發表留言後，該留言卡片內容必須在畫面上可見。


---

## P2-110 · H02 · gpt-5.6-terra · concise

**斷言**：`await expect( authorCommentCard.getByRole('button', { name: /delete comment/i }), ).toHaveCount(0)`

**引用**：`docs/src/content/docs/specifications/frontend/routing.md:18-18` @ `ebbcdeb8d55b`

**模型給的摘錄**：   - Delete comment button (only shown to comment's author)

**該檔原始行**

```
   18|   - Delete comment button (only shown to comment's author)
```

**核對器理由**：規範明確說明文章頁上的刪除留言按鈕只會顯示給該留言的作者，非作者看該則留言時不應有刪除按鈕。


---

## P2-111 · H02 · gpt-5.6-terra · concise

**斷言**：`await expect( page.getByRole('button', { name: /edit article/i }), ).toHaveCount(0)`

**引用**：`specs/e2e/articles.spec.ts:282-305` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should only allow author to edit/delete article', async ({ page, browser }) => {
    const article = generateUniqueArticle();

    // Create article as first user
    await createArticle(page, article);

    // Get article URL
    const articleUrl = page.url();

    // Create a second user i

**該檔原始行**

```
  282|   test('should only allow author to edit/delete article', async ({ page, browser }) => {
  283|     const article = generateUniqueArticle();
  284| 
  285|     // Create article as first user
  286|     await createArticle(page, article);
  287| 
  288|     // Get article URL
  289|     const articleUrl = page.url();
  290| 
  291|     // Create a second user in new context (not sharing cookies with first user)
  292|     const context2 = await browser.newContext();
  293|     const page2 = await context2.newPage();
  294|     const user2 = generateUniqueUser();
  295|     await register(page2, user2.username, user2.email, user2.password);
  296| 
  297|     // Visit the article as second user
  298|     await page2.goto(articleUrl);
  299| 
  300|     // Should not see Edit/Delete buttons
  301|     await expect(page2.locator('a:has-text("Edit Article")')).not.toBeVisible();
  302|     await expect(page2.locator('button:has-text("Delete Article")')).not.toBeVisible();
  303| 
  304|     await context2.close();
  305|   });
```

**核對器理由**：E2E 測試明確驗證非作者使用者造訪文章頁面時，不應看到編輯文章（Edit Article）與刪除文章（Delete Article）的操作按鈕。


---

## P2-112 · H02 · gpt-5.6-terra · concise

**斷言**：`await expect( page.getByRole('button', { name: /delete article/i }), ).toHaveCount(0)`

**引用**：`docs/src/content/docs/specifications/frontend/routing.md:14-15` @ `ebbcdeb8d55b`

**模型給的摘錄**：- Article page (URL: `/article/article-slug-here` )
  - Delete article button (only shown to article's author)

**該檔原始行**

```
   14| - Article page (URL: `/article/article-slug-here` )
   15|   - Delete article button (only shown to article's author)
```

**核對器理由**：規格明確規範文章頁的刪除文章按鈕僅在使用者為文章作者時顯示，因此非作者或未登入者開啟時不應看見刪除文章按鈕。


---

## P2-113 · H02 · gpt-5.6-terra · concise

**斷言**：`await expect(page.getByRole('heading', { name: article.title })).toBeVisible()`

**引用**：`specs/e2e/articles.spec.ts:38-41` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Should be on article page
    await expect(page).toHaveURL(/\/article\/.+/);

    // Should show article content
    await expect(page.locator('h1')).toHaveText(article.title);

**該檔原始行**

```
   38|     await expect(page).toHaveURL(/\/article\/.+/);
   39| 
   40|     // Should show article content
   41|     await expect(page.locator('h1')).toHaveText(article.title);
```

**核對器理由**：E2E 測試明確驗證進入文章頁面後，文章標題（h1 heading）必須顯示且可見。


---

## P2-114 · H02 · gpt-5.6-terra · concise

**斷言**：`await expect( page.getByText('Comment written by the article author.'), ).toBeVisible()`

**引用**：`specs/e2e/comments.spec.ts:31-36` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should add a comment to an article', async ({ page }) => {
    const commentText = 'This is a test comment from Playwright!';
    await addComment(page, commentText);
    // Comment should be visible
    await expect(page.locator(`.card:not(.comment-form) .card-block:has-text("${commentText}

**該檔原始行**

```
   31|   test('should add a comment to an article', async ({ page }) => {
   32|     const commentText = 'This is a test comment from Playwright!';
   33|     await addComment(page, commentText);
   34|     // Comment should be visible
   35|     await expect(page.locator(`.card:not(.comment-form) .card-block:has-text("${commentText}")`)).toBeVisible();
   36|   });
```

**核對器理由**：公開 E2E 測試驗證了在文章頁上發表的留言內容必須在畫面上可見。


---

## P2-115 · H02 · gpt-5.6-terra · concise

**斷言**：`await expect( page.getByRole('button', { name: /edit article/i }), ).toHaveCount(0)`

**引用**：`specs/e2e/articles.spec.ts:282-302` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should only allow author to edit/delete article', async ({ page, browser }) => {
    const article = generateUniqueArticle();

    // Create article as first user
    await createArticle(page, article);

    // Get article URL
    const articleUrl = page.url();

    // Create a second user i

**該檔原始行**

```
  282|   test('should only allow author to edit/delete article', async ({ page, browser }) => {
  283|     const article = generateUniqueArticle();
  284| 
  285|     // Create article as first user
  286|     await createArticle(page, article);
  287| 
  288|     // Get article URL
  289|     const articleUrl = page.url();
  290| 
  291|     // Create a second user in new context (not sharing cookies with first user)
  292|     const context2 = await browser.newContext();
  293|     const page2 = await context2.newPage();
  294|     const user2 = generateUniqueUser();
  295|     await register(page2, user2.username, user2.email, user2.password);
  296| 
  297|     // Visit the article as second user
  298|     await page2.goto(articleUrl);
  299| 
  300|     // Should not see Edit/Delete buttons
  301|     await expect(page2.locator('a:has-text("Edit Article")')).not.toBeVisible();
  302|     await expect(page2.locator('button:has-text("Delete Article")')).not.toBeVisible();
```

**核對器理由**：規格測試明確要求非作者在查看文章頁時，不可看見 Edit Article 按鈕/連結。


---

## P2-116 · H02 · gpt-5.6-terra · concise

**斷言**：`await expect( page.getByRole('button', { name: /delete article/i }), ).toHaveCount(0)`

**引用**：`docs/src/content/docs/specifications/frontend/routing.md:14-15` @ `ebbcdeb8d55b`

**模型給的摘錄**：- Article page (URL: `/article/article-slug-here` )
  - Delete article button (only shown to article's author)

**該檔原始行**

```
   14| - Article page (URL: `/article/article-slug-here` )
   15|   - Delete article button (only shown to article's author)
```

**核對器理由**：規格明確陳述文章頁上的 Delete article 按鈕僅顯示給文章作者，因此未登入訪客看到該按鈕的數量應為 0。


---

## P2-117 · H02 · gpt-5.6-terra · concise

**斷言**：`await expect(page.getByRole('button', { name: /delete/i })).toHaveCount(0)`

**引用**：`docs/src/content/docs/specifications/frontend/routing.md:14-18` @ `ebbcdeb8d55b`

**模型給的摘錄**：- Article page (URL: `/article/article-slug-here` )
   - Delete article button (only shown to article's author)
   - Render markdown from server client side
   - Comments section at bottom of page
   - Delete comment button (only shown to comment's author)

**該檔原始行**

```
   14| - Article page (URL: `/article/article-slug-here` )
   15|   - Delete article button (only shown to article's author)
   16|   - Render markdown from server client side
   17|   - Comments section at bottom of page
   18|   - Delete comment button (only shown to comment's author)
```

**核對器理由**：規格明確規範文章頁上的刪除文章按鈕僅作者可見，且刪除留言按鈕僅留言作者可見，因此未登入訪客畫面上不應出現任何 delete 按鈕。


---

## P2-118 · H02 · gpt-5.6-terra · concise

**斷言**：`await expect(page.getByRole('heading', { name: article.title })).toBeVisible()`

**引用**：`specs/e2e/articles.spec.ts:38-41` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Should be on article page
    await expect(page).toHaveURL(/\/article\/.+/);

    // Should show article content
    await expect(page.locator('h1')).toHaveText(article.title);

**該檔原始行**

```
   38|     await expect(page).toHaveURL(/\/article\/.+/);
   39| 
   40|     // Should show article content
   41|     await expect(page.locator('h1')).toHaveText(article.title);
```

**核對器理由**：E2E 測試明確要求進入文章頁面後，標題 heading（h1）必須顯示該文章的 title。


---

## P2-119 · H02 · gpt-5.6-terra · concise

**斷言**：`await expect( page.getByPlaceholder(/write a comment/i), ).toBeVisible()`

**引用**：`specs/e2e/comments.spec.ts:108-112` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Wait for Angular to complete auth check - either comment form OR sign in link appears
    await page2.waitForSelector('textarea[placeholder="Write a comment..."], a[href="/login"]', { timeout: 10000 });
    // Should see sign in/sign up links instead of comment form
    await expect(page2.loc

**該檔原始行**

```
  108|     // Wait for Angular to complete auth check - either comment form OR sign in link appears
  109|     await page2.waitForSelector('textarea[placeholder="Write a comment..."], a[href="/login"]', { timeout: 10000 });
  110|     // Should see sign in/sign up links instead of comment form
  111|     await expect(page2.locator('a[href="/login"]')).toBeVisible();
  112|     await expect(page2.locator('textarea[placeholder="Write a comment..."]')).not.toBeVisible();
```

**核對器理由**：契約在此測試了未登入時看不到留言輸入框（textarea[placeholder="Write a comment..."]），反之說明登入狀態下該留言輸入框可見且作為登入檢查依據，同時 SELECTORS.md 亦定義了該 placeholder。


---

## P2-120 · H02 · gpt-5.6-terra · concise

**斷言**：`await expect( page.getByRole('button', { name: /edit article/i }), ).toHaveCount(0)`

**引用**：`specs/e2e/articles.spec.ts:297-302` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Visit the article as second user
    await page2.goto(articleUrl);

    // Should not see Edit/Delete buttons
    await expect(page2.locator('a:has-text("Edit Article")')).not.toBeVisible();
    await expect(page2.locator('button:has-text("Delete Article")')).not.toBeVisible();

**該檔原始行**

```
  297|     // Visit the article as second user
  298|     await page2.goto(articleUrl);
  299| 
  300|     // Should not see Edit/Delete buttons
  301|     await expect(page2.locator('a:has-text("Edit Article")')).not.toBeVisible();
  302|     await expect(page2.locator('button:has-text("Delete Article")')).not.toBeVisible();
```

**核對器理由**：E2E 測試明確驗證非作者使用者瀏覽文章頁面時，不應看到編輯文章（Edit Article）的按鈕或連結。


---

## P2-121 · H02 · gpt-5.6-terra · concise

**斷言**：`await expect( page.getByRole('button', { name: /delete article/i }), ).toHaveCount(0)`

**引用**：`specs/e2e/articles.spec.ts:297-302` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Visit the article as second user
    await page2.goto(articleUrl);

    // Should not see Edit/Delete buttons
    await expect(page2.locator('a:has-text("Edit Article")')).not.toBeVisible();
    await expect(page2.locator('button:has-text("Delete Article")')).not.toBeVisible();

**該檔原始行**

```
  297|     // Visit the article as second user
  298|     await page2.goto(articleUrl);
  299| 
  300|     // Should not see Edit/Delete buttons
  301|     await expect(page2.locator('a:has-text("Edit Article")')).not.toBeVisible();
  302|     await expect(page2.locator('button:has-text("Delete Article")')).not.toBeVisible();
```

**核對器理由**：E2E 測試明確斷言非作者的使用者造訪文章頁面時，不應看見 Delete Article 按鈕。


---

## P2-122 · H02 · gpt-5.6-terra · concise

**斷言**：`await expect(page.getByText(commentBody)).toBeVisible()`

**引用**：`specs/e2e/comments.spec.ts:31-36` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should add a comment to an article', async ({ page }) => {
    const commentText = 'This is a test comment from Playwright!';
    await addComment(page, commentText);
    // Comment should be visible
    await expect(page.locator(`.card:not(.comment-form) .card-block:has-text("${commentText}

**該檔原始行**

```
   31|   test('should add a comment to an article', async ({ page }) => {
   32|     const commentText = 'This is a test comment from Playwright!';
   33|     await addComment(page, commentText);
   34|     // Comment should be visible
   35|     await expect(page.locator(`.card:not(.comment-form) .card-block:has-text("${commentText}")`)).toBeVisible();
   36|   });
```

**核對器理由**：E2E 測試明確驗證了在文章頁發表留言後，該留言內容在頁面上呈現可見。


---

## P2-123 · H02 · gpt-5.6-terra · concise

**斷言**：`await expect(ownComment.getByRole('button', { name: /delete/i })).toBeVisible()`

**引用**：`docs/src/content/docs/specifications/frontend/routing.md:14-18` @ `ebbcdeb8d55b`

**模型給的摘錄**：- Article page (URL: `/article/article-slug-here` )
  - Delete article button (only shown to article's author)
  - Render markdown from server client side
  - Comments section at bottom of page
  - Delete comment button (only shown to comment's author)

**該檔原始行**

```
   14| - Article page (URL: `/article/article-slug-here` )
   15|   - Delete article button (only shown to article's author)
   16|   - Render markdown from server client side
   17|   - Comments section at bottom of page
   18|   - Delete comment button (only shown to comment's author)
```

**核對器理由**：契約明確規定在文章頁面中，留言刪除按鈕僅會顯示給該留言的作者（Delete comment button (only shown to comment's author)）。


---

## P2-124 · H02 · gpt-5.6-terra · concise

**斷言**：`await expect( authorCommentCard.getByRole('button', { name: /delete/i }), ).toHaveCount(0)`

**引用**：`docs/src/content/docs/specifications/frontend/routing.md:18-18` @ `ebbcdeb8d55b`

**模型給的摘錄**：   - Delete comment button (only shown to comment's author)

**該檔原始行**

```
   18|   - Delete comment button (only shown to comment's author)
```

**核對器理由**：規格明確規範文章頁上的刪除留言按鈕僅對該則留言的作者顯示，因此非留言作者的使用者看不到該按鈕。


---

## P2-125 · H03 · gpt-5.6-terra · concise

**斷言**：`await expect(articlePreviews).toHaveCount(10)`

**引用**：`specs/e2e/url-navigation.spec.ts:252-254` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // First page should show 10 articles
    const articlesOnPage1 = await page.locator('.article-preview').count();
    expect(articlesOnPage1).toBe(10);

**該檔原始行**

```
  252|     // First page should show 10 articles
  253|     const articlesOnPage1 = await page.locator('.article-preview').count();
  254|     expect(articlesOnPage1).toBe(10);
```

**核對器理由**：E2E 測試明確測試了在 15 篇標籤篩選文章下，第一頁的 .article-preview 數量為 10 篇。


---

## P2-126 · H03 · gpt-5.6-terra · concise

**斷言**：`await expect(articlePreviews).toHaveCount(5)`

**引用**：`specs/e2e/url-navigation.spec.ts:266-268` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Second page should have 5 articles (15 - 10 = 5)
    const articlesOnPage2 = await page.locator('.article-preview').count();
    expect(articlesOnPage2).toBe(5);

**該檔原始行**

```
  266|     // Second page should have 5 articles (15 - 10 = 5)
  267|     const articlesOnPage2 = await page.locator('.article-preview').count();
  268|     expect(articlesOnPage2).toBe(5);
```

**核對器理由**：E2E 測試明確驗證了在 15 篇文章的標籤分頁下，切換至第 2 頁時文章預覽數量為 5 篇。


---

## P2-127 · H03 · gpt-5.6-terra · concise

**斷言**：`await expect(page).toHaveURL(new RegExp(`${UI.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/#/?$`))`

**引用**：`specs/e2e/url-navigation.spec.ts:227-229` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Click Global Feed and wait for URL to change to root path
    await page.click('.nav-link:has-text("Global Feed")');
    await expect(page).toHaveURL('/');

**該檔原始行**

```
  227|     // Click Global Feed and wait for URL to change to root path
  228|     await page.click('.nav-link:has-text("Global Feed")');
  229|     await expect(page).toHaveURL('/');
```

**核對器理由**：契約中的測試明確驗證了在標籤分頁（page 2）點擊 Global Feed 切回全部文章列表時，URL 會變更回根路徑 '/'。


---

## P2-128 · H04 · gpt-5.6-terra · concise

**斷言**：`await expect(page.getByRole('link', { name: 'Your Feed' })).toHaveClass( /active/, )`

**引用**：`specs/e2e/url-navigation.spec.ts:71-75` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Click Your Feed
    await page.click('.nav-link:has-text("Your Feed")');
    // Should navigate to /?feed=following
    await expect(page).toHaveURL('/?feed=following');
    await expect(page.locator('.nav-link:has-text("Your Feed")')).toHaveClass(/active/);

**該檔原始行**

```
   71|     await page.click('.nav-link:has-text("Your Feed")');
   72|     // Should navigate to /?feed=following
   73|     await expect(page).toHaveURL('/?feed=following');
   74|     await expect(page.locator('.nav-link:has-text("Your Feed")')).toHaveClass(/active/);
   75|   });
```

**核對器理由**：公開的 E2E 測試明確斷言點擊「Your Feed」後該連結必須具有 active class。


---

## P2-129 · H04 · gpt-5.6-terra · concise

**斷言**：`await expect(page.getByRole('link', { name: 'Your Feed' })).toHaveClass( /active/, )`

**引用**：`specs/e2e/url-navigation.spec.ts:71-75` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Click Your Feed
    await page.click('.nav-link:has-text("Your Feed")');
    // Should navigate to /?feed=following
    await expect(page).toHaveURL('/?feed=following');
    await expect(page.locator('.nav-link:has-text("Your Feed")')).toHaveClass(/active/);

**該檔原始行**

```
   71|     await page.click('.nav-link:has-text("Your Feed")');
   72|     // Should navigate to /?feed=following
   73|     await expect(page).toHaveURL('/?feed=following');
   74|     await expect(page.locator('.nav-link:has-text("Your Feed")')).toHaveClass(/active/);
   75|   });
```

**核對器理由**：契約規格中明確測試了在點擊「Your Feed」分頁連結後，該分頁連結應具有 active class。


---

## P2-130 · S02 · gpt-5.6-terra · concise

**斷言**：`expect(duplicateRegistration.status).toBeGreaterThanOrEqual(400)`

**引用**：`specs/api/hurl/errors_auth.hurl:66-77` @ `ebbcdeb8d55b`

**模型給的摘錄**：# Register duplicate email
POST {{host}}/api/users
{
  "user": {
    "username": "ea_dup2_{{uid}}",
    "email": "ea_dup_{{uid}}@test.com",
    "password": "password123"
  }
}
HTTP 409
[Asserts]
jsonpath "$.errors.email[0]" == "has already been taken"

**該檔原始行**

```
   66| # Register duplicate email
   67| POST {{host}}/api/users
   68| {
   69|   "user": {
   70|     "username": "ea_dup2_{{uid}}",
   71|     "email": "ea_dup_{{uid}}@test.com",
   72|     "password": "password123"
   73|   }
   74| }
   75| HTTP 409
   76| [Asserts]
   77| jsonpath "$.errors.email[0]" == "has already been taken"
```

**核對器理由**：規格測試明確要求使用已註冊的 duplicate email 再次註冊時，API 必須回應 409 錯誤狀態碼。


---

## P2-131 · S02 · gpt-5.6-terra · concise

**斷言**：`expect(duplicateRegistration.json).toHaveProperty('errors')`

**引用**：`specs/api/hurl/errors_auth.hurl:66-77` @ `ebbcdeb8d55b`

**模型給的摘錄**：# Register duplicate email
POST {{host}}/api/users
{
  "user": {
    "username": "ea_dup2_{{uid}}",
    "email": "ea_dup_{{uid}}@test.com",
    "password": "password123"
  }
}
HTTP 409
[Asserts]
jsonpath "$.errors.email[0]" == "has already been taken"

**該檔原始行**

```
   66| # Register duplicate email
   67| POST {{host}}/api/users
   68| {
   69|   "user": {
   70|     "username": "ea_dup2_{{uid}}",
   71|     "email": "ea_dup_{{uid}}@test.com",
   72|     "password": "password123"
   73|   }
   74| }
   75| HTTP 409
   76| [Asserts]
   77| jsonpath "$.errors.email[0]" == "has already been taken"
```

**核對器理由**：官方測試明確測驗了重複 email 註冊 API 應回傳 HTTP 409 且包含 errors 欄位。


---

## P2-132 · S02 · gpt-5.6-terra · concise

**斷言**：`await expect(page).toHaveURL(/#\/register/)`

**引用**：`specs/e2e/error-handling.spec.ts:60-65` @ `ebbcdeb8d55b`

**模型給的摘錄**：    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    // Should show error messages
    await expect(page.locator('.error-messages')).toBeVisible();
    await expect(page).toHaveURL('/register');

**該檔原始行**

```
   60|     await page.fill('input[name="password"]', 'password123');
   61|     await page.click('button[type="submit"]');
   62|     // Should show error messages
   63|     await expect(page.locator('.error-messages')).toBeVisible();
   64|     await expect(page).toHaveURL('/register');
   65|     await expect(page.locator('input[name="email"]')).toBeVisible();
```

**核對器理由**：測試明確驗證當註冊遇到驗證錯誤（包含 email 被佔用）時，頁面停留在註冊頁 URL（/register）而不會成功跳轉。


---

## P2-133 · S02 · gpt-5.6-terra · concise

**斷言**：`await expect(page.getByText(/email.*has already been taken/i)).toBeVisible()`

**引用**：`specs/e2e/error-handling.spec.ts:50-66` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should handle 400 on registration with validation errors', async ({ page }) => {
    await mockApiError(page, '/users', 400, {
      errors: {
        email: ['is already taken'],
        username: ['is too short (minimum is 3 characters)'],
      },
    });
    await page.goto('/register');

**該檔原始行**

```
   50|   test('should handle 400 on registration with validation errors', async ({ page }) => {
   51|     await mockApiError(page, '/users', 400, {
   52|       errors: {
   53|         email: ['is already taken'],
   54|         username: ['is too short (minimum is 3 characters)'],
   55|       },
   56|     });
   57|     await page.goto('/register');
   58|     await page.fill('input[name="username"]', 'ab');
   59|     await page.fill('input[name="email"]', 'taken@test.com');
   60|     await page.fill('input[name="password"]', 'password123');
   61|     await page.click('button[type="submit"]');
   62|     // Should show error messages
   63|     await expect(page.locator('.error-messages')).toBeVisible();
   64|     await expect(page).toHaveURL('/register');
   65|     await expect(page.locator('input[name="email"]')).toBeVisible();
   66|   });
```

**核對器理由**：公開契約的 E2E 測試僅驗證註冊時若 email 被佔用會顯示 .error-messages 區塊，並未明確要求前端畫面上必須出現文字「email has already been taken」。


---

## P2-134 · S02 · gpt-5.6-terra · concise

**斷言**：`expect(response.status).toBeLessThan(500)`

**引用**：`specs/api/hurl/errors_auth.hurl:66-77` @ `ebbcdeb8d55b`

**模型給的摘錄**：# Register duplicate email
POST {{host}}/api/users
{
  "user": {
    "username": "ea_dup2_{{uid}}",
    "email": "ea_dup_{{uid}}@test.com",
    "password": "password123"
  }
}
HTTP 409
[Asserts]
jsonpath "$.errors.email[0]" == "has already been taken"

**該檔原始行**

```
   66| # Register duplicate email
   67| POST {{host}}/api/users
   68| {
   69|   "user": {
   70|     "username": "ea_dup2_{{uid}}",
   71|     "email": "ea_dup_{{uid}}@test.com",
   72|     "password": "password123"
   73|   }
   74| }
   75| HTTP 409
   76| [Asserts]
   77| jsonpath "$.errors.email[0]" == "has already been taken"
```

**核對器理由**：公開契約的 Hurl 測試明確規範當使用已存在的重複 email 進行註冊時，API 應回傳 409（屬於小於 500 的 4xx 狀態碼）。


---

## P2-135 · S02 · gpt-5.6-terra · concise

**斷言**：`expect(response.json).toHaveProperty('errors')`

**引用**：`specs/api/hurl/errors_auth.hurl:66-77` @ `ebbcdeb8d55b`

**模型給的摘錄**：# Register duplicate email
POST {{host}}/api/users
{
  "user": {
    "username": "ea_dup2_{{uid}}",
    "email": "ea_dup_{{uid}}@test.com",
    "password": "password123"
  }
}
HTTP 409
[Asserts]
jsonpath "$.errors.email[0]" == "has already been taken"

**該檔原始行**

```
   66| # Register duplicate email
   67| POST {{host}}/api/users
   68| {
   69|   "user": {
   70|     "username": "ea_dup2_{{uid}}",
   71|     "email": "ea_dup_{{uid}}@test.com",
   72|     "password": "password123"
   73|   }
   74| }
   75| HTTP 409
   76| [Asserts]
   77| jsonpath "$.errors.email[0]" == "has already been taken"
```

**核對器理由**：契約中的 Hurl 測試明確驗證使用重複 email 註冊時，回應包含 errors 物件且其下有具體的錯誤訊息。


---

## P2-136 · S02 · gpt-5.6-terra · concise

**斷言**：`await expect(page).toHaveURL(/#\/register/)`

**引用**：`specs/e2e/error-handling.spec.ts:62-66` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Should show error messages
    await expect(page.locator('.error-messages')).toBeVisible();
    await expect(page).toHaveURL('/register');
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });

**該檔原始行**

```
   62|     // Should show error messages
   63|     await expect(page.locator('.error-messages')).toBeVisible();
   64|     await expect(page).toHaveURL('/register');
   65|     await expect(page.locator('input[name="email"]')).toBeVisible();
   66|   });
```

**核對器理由**：E2E 錯誤處理測試明確驗證註冊時發生驗證錯誤（包含 email 被佔用）後，頁面應維持停留在 /register 路由。


---

## P2-137 · S02 · gpt-5.6-terra · concise

**斷言**：`await expect(page.locator('.error-messages')).toContainText(/email.*already|email.*taken/i)`

**引用**：`specs/e2e/error-handling.spec.ts:50-64` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should handle 400 on registration with validation errors', async ({ page }) => {
    await mockApiError(page, '/users', 400, {
      errors: {
        email: ['is already taken'],
        username: ['is too short (minimum is 3 characters)'],
      },
    });
    await page.goto('/register');

**該檔原始行**

```
   50|   test('should handle 400 on registration with validation errors', async ({ page }) => {
   51|     await mockApiError(page, '/users', 400, {
   52|       errors: {
   53|         email: ['is already taken'],
   54|         username: ['is too short (minimum is 3 characters)'],
   55|       },
   56|     });
   57|     await page.goto('/register');
   58|     await page.fill('input[name="username"]', 'ab');
   59|     await page.fill('input[name="email"]', 'taken@test.com');
   60|     await page.fill('input[name="password"]', 'password123');
   61|     await page.click('button[type="submit"]');
   62|     // Should show error messages
   63|     await expect(page.locator('.error-messages')).toBeVisible();
   64|     await expect(page).toHaveURL('/register');
```

**核對器理由**：E2E 測試驗證了在註冊頁面提交已被佔用的 email 時，頁面上的 .error-messages 必須顯示對應的錯誤訊息。


---

## P2-138 · S07 · gpt-5.6-terra · concise

**斷言**：`await expect(page).toHaveURL(new RegExp(`${UI.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/#/?$`))`

**引用**：`specs/e2e/articles.spec.ts:76-80` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Delete the article
    await deleteArticle(page);

    // Should be redirected to home
    await expect(page).toHaveURL('/');

**該檔原始行**

```
   76|     // Delete the article
   77|     await deleteArticle(page);
   78| 
   79|     // Should be redirected to home
   80|     await expect(page).toHaveURL('/');
```

**核對器理由**：官方 E2E 測試在測試刪除文章時明確斷言刪除後會被重新導向至首頁（'/'）。


---

## P2-139 · S07 · gpt-5.6-terra · concise

**斷言**：`await expect(page).toHaveURL(new RegExp(`${UI.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/#/?$`))`

**引用**：`specs/e2e/articles.spec.ts:76-80` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Delete the article
    await deleteArticle(page);

    // Should be redirected to home
    await expect(page).toHaveURL('/');

**該檔原始行**

```
   76|     // Delete the article
   77|     await deleteArticle(page);
   78| 
   79|     // Should be redirected to home
   80|     await expect(page).toHaveURL('/');
```

**核對器理由**：E2E 測試明確斷言作者點擊刪除文章後，頁面應被導向回首頁（'/'）。


---

## P2-140 · S07 · gpt-5.6-terra · concise

**斷言**：`await expect(page).toHaveURL(new RegExp(`${UI.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/#/?$`))`

**引用**：`specs/e2e/articles.spec.ts:79-81` @ `ebbcdeb8d55b`

**模型給的摘錄**：    // Should be redirected to home
    await expect(page).toHaveURL('/');

**該檔原始行**

```
   79|     // Should be redirected to home
   80|     await expect(page).toHaveURL('/');
   81| 
```

**核對器理由**：官方 E2E 測試在刪除文章後明確斷言使用者應被重新導向回首頁（/）。


---

## P2-141 · S09 · gpt-5.6-terra · concise

**斷言**：`await expect(page.getByText('Comment written by User A')).toBeVisible()`

**引用**：`specs/api/hurl/comments.hurl:82-120` @ `ebbcdeb8d55b`

**模型給的摘錄**：# Selective deletion: create two comments, delete one, verify the other remains
POST {{host}}/api/articles/{{slug}}/comments
Authorization: Token {{token}}
{
  "comment": {
    "body": "First comment"
  }
}
HTTP 201
[Captures]
first_comment_id: jsonpath "$.comment.id"

POST {{host}}/api/articles/{{s

**該檔原始行**

```
   82| # Selective deletion: create two comments, delete one, verify the other remains
   83| POST {{host}}/api/articles/{{slug}}/comments
   84| Authorization: Token {{token}}
   85| {
   86|   "comment": {
   87|     "body": "First comment"
   88|   }
   89| }
   90| HTTP 201
   91| [Captures]
   92| first_comment_id: jsonpath "$.comment.id"
   93| 
   94| POST {{host}}/api/articles/{{slug}}/comments
   95| Authorization: Token {{token}}
   96| {
   97|   "comment": {
   98|     "body": "Second comment"
   99|   }
  100| }
  101| HTTP 201
  102| 
  103| # Verify two comments exist
  104| GET {{host}}/api/articles/{{slug}}/comments
  105| HTTP 200
  106| [Asserts]
  107| jsonpath "$.comments" count == 2
  108| 
  109| # Delete the first comment
  110| DELETE {{host}}/api/articles/{{slug}}/comments/{{first_comment_id}}
  111| Authorization: Token {{token}}
  112| HTTP 204
  113| 
  114| # Verify only the second comment remains
  115| GET {{host}}/api/articles/{{slug}}/comments
  116| HTTP 200
  117| [Asserts]
  118| jsonpath "$.comments" count == 1
  119| jsonpath "$.comments[0].body" == "Second comment"
  120| 
```

**核對器理由**：Hurl 測試明確規範並測試了「在存在多則留言時刪除其中一則，另一則留言仍應保留（未被刪除）」的選擇性刪除行為。


---

## P2-142 · S09 · gpt-5.6-terra · concise

**斷言**：`await expect(page.getByText('Comment written by user B')).toHaveCount(0)`

**引用**：`specs/e2e/comments.spec.ts:38-48` @ `ebbcdeb8d55b`

**模型給的摘錄**：  test('should delete own comment', async ({ page }) => {
    const commentText = 'Comment to be deleted';
    await addComment(page, commentText);
    // Comment should be visible
    await expect(page.locator(`.card:not(.comment-form) .card-block:has-text("${commentText}")`)).toBeVisible();
    //

**該檔原始行**

```
   38|   test('should delete own comment', async ({ page }) => {
   39|     const commentText = 'Comment to be deleted';
   40|     await addComment(page, commentText);
   41|     // Comment should be visible
   42|     await expect(page.locator(`.card:not(.comment-form) .card-block:has-text("${commentText}")`)).toBeVisible();
   43|     // Delete the comment
   44|     await deleteComment(page, commentText);
   45|     // Comment should no longer be visible
   46|     await expect(page.locator(`.card:not(.comment-form) .card-block:has-text("${commentText}")`)).not.toBeVisible();
   47|   });
   48| 
```

**核對器理由**：官方 E2E 測試明確驗證了在刪除使用者自己的留言後，該留言內容在頁面上不再可見（數量為 0 / not.toBeVisible）。


---

## P2-143 · S12 · gpt-5.6-terra · concise

**斷言**：`await expect(pageTwo).toHaveClass(/active/)`

**引用**：`specs/e2e/SELECTORS.md:213-213` @ `ebbcdeb8d55b`

**模型給的摘錄**：- **Pagination active**: The current page's `.page-item` has the CSS class `active`.

**該檔原始行**

```
  213| - **Pagination active**: The current page's `.page-item` has the CSS class `active`.
```

**核對器理由**：SELECTORS.md 明確規定分頁選中時當前頁應帶有 active CSS class。

