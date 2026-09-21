# Final P4 稽核包（55 條）

公開材料固定在 RealWorld commit `ebbcdeb8d55b42a3a613c787560498b8ef10003f`，共 36 個檔。核對器每一條都拿到**全部**這些檔（沒有逐條檢索），清單見文末。


**稽核方式**：每條看「需求」「Gherkin」「斷言」三欄，判斷它有沒有依據；不同意的，在 CSV 的 `auditor_verdict` 欄填 P0／P1／P2／P4 與一句理由。

「關鍵字命中」是機械 grep，只告訴你最接近的公開材料在哪，**不是判定**。


---

## P4-01 · H01 · gemini-3.8-flash · precise

`PR_gem_precise_H01_s2#3` （`generated/PR_gem_precise_H01_s2.spec.ts` 第 43 行）

**需求**

### H01 文章標籤與編輯
（group: Conduit ▸ 文章｜tags: Full,Major）

```
--- steps ---
1. 以已登入的使用者進入新增文章頁
2. 填入標題與內文，加入三個標籤後發佈
3. 在該文章頁點選編輯
4. 將標題改成另一個字串，並把標籤全部移除後送出
--- expect ---
文章頁顯示的內容與輸入一致；編輯送出後標題更新，標籤不再出現。
--- note ---
標籤取三個是為了覆蓋多標籤的顯示。
```

**Gherkin**

```gherkin
@item:H01
    Scenario: Article tags and editing
      Given a logged-in user is on the new article page
      When the user fills in a title and body, adds three tags, and publishes the article
      Then the article page should display content matching the input
      When the user edits the article from the article page
      And changes the title to another string, removes all tags, and submits
      Then the updated title should be displayed
      And the tags should no longer appear
```

**斷言（▶ 那一行）**

```ts
      for (const tag of tags) {
        await expect(page.locator('.tag-list').getByText(tag)).toBeVisible();
      }
  
      // When the user edits the article from the article page
      await page.getByRole('link', { name: /Edit Article/i }).first().click();
▶     await expect(page).toHaveURL(/#\/editor\/.+/);
  
      // And changes the title to another string, removes all tags, and submits
      const updatedTitle = `Updated-${Date.now()}`;
      await titleInput.fill(updatedTitle);
  
      // Remove all tags in editor
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅描述在該文章頁點選編輯並修改送出，未要求驗證編輯頁的 URL 格式。

**為什麼公開材料不支持**（P2 核對器）：公開契約中規定的編輯文章路由為 `/editor/:slug`，未包含或測試帶有 hash 路由格式（/#/editor/.+）的可觀測行為。

**關鍵字命中（機械 grep，僅供導航）**

- `editor` → `docs/src/content/docs/specifications/frontend/routing.md:13` ｜ - Editor page to create/edit articles (URL: `/editor`, `/editor/article-slug-here` )
- `editor` → `docs/src/content/docs/specifications/frontend/templates.md:85` ｜ <a class="nav-link" href="/editor"> <i class="ion-compose"></i>&nbsp;New Article </a>


---

## P4-02 · H02 · gemini-3.8-flash · precise

`PR_gem_precise_H02_s2#2` （`generated/PR_gem_precise_H02_s2.spec.ts` 第 25 行）

**需求**

### H02 文章頁的可見性與權限
（group: Conduit ▸ 文章｜tags: Full,Major）

```
--- steps ---
1. 以作者身分建立一篇文章，並在該文章下留一則留言
2. 以未登入的訪客開啟該文章頁
3. 以另一位已登入、非作者的使用者開啟同一頁
4. 該使用者在同一頁留下自己的留言
--- expect ---
訪客看得到文章但不能留言；非作者看不到編輯與刪除文章的控制項；留言的刪除控制項只對該留言的作者出現。
--- note ---
只驗畫面上看得到什麼，不含 API 層的權限。
```

**Gherkin**

```gherkin
@item:H02
    Scenario: Article page visibility and permissions
      Given an author creates an article and leaves a comment on it
      When an unauthenticated visitor opens the article page
      Then the visitor can see the article but cannot leave a comment
      When another logged-in user who is not the author opens the article page
      Then the user should not see the edit and delete controls for the article
      When this user leaves their own comment on the article page
      Then the delete control for a comment should only appear to the author of that comment
```

**斷言（▶ 那一行）**

```ts
      // When an unauthenticated visitor opens the article page
      await page.goto(`${UI}/#/article/${article.slug}`);
  
      // Then the visitor can see the article but cannot leave a comment
      await expect(page.getByRole('heading', { name: article.title })).toBeVisible();
      await expect(page.getByText(article.body)).toBeVisible();
▶     await expect(page.getByText(authorCommentBody)).toBeVisible();
  
      await expect(page.getByPlaceholder('Write a comment...')).not.toBeVisible();
      await expect(page.getByRole('button', { name: 'Post Comment' })).not.toBeVisible();
      await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
  
      // When another logged-in user who is not the author opens the article page
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅要求訪客看得到文章且不能留言，未提及訪客是否應看見已留下的留言內容。

**為什麼公開材料不支持**（P2 核對器）：公開材料中雖有說明文章頁包含留言區以及未登入不能留言，但未規定或測試未登入訪客瀏覽文章頁時必須驗證既有留言內容可見。

**關鍵字命中**：無


---

## P4-03 · H03 · gemini-3.8-flash · precise

`PR_gem_precise_H03_s1#2` （`generated/PR_gem_precise_H03_s1.spec.ts` 第 41 行）

**需求**

### H03 標籤篩選的分頁
（group: Conduit ▸ 文章列表｜tags: Full,Major）

```
--- steps ---
1. 準備某個標籤底下共 15 篇文章
2. 於首頁以該標籤篩選
3. 點選分頁列的第 2 頁
4. 另開一頁，直接輸入帶 page=2 的網址
5. 切回全部文章的列表
--- expect ---
每頁的文章數符合分頁設定，第二頁是接續的文章；網址會反映目前頁碼；直接輸入網址可以到達同一頁；切回全部文章時回到第一頁。
--- note ---
每頁筆數以產品預設為準。
```

**Gherkin**

```gherkin
@item:H03
    Scenario: Pagination under tag filter
      Given there are 15 articles under a specific tag
      When I filter by this tag on the home page
      Then the number of articles per page matches the pagination setting
      When I select page 2 in the pagination bar
      Then the second page displays the consecutive articles
      And the URL reflects the current page number
      When I open a new page directly with the URL containing page=2
      Then I arrive at the same page
      When I switch back to the all articles list
      Then the list returns to the first page
```

**斷言（▶ 那一行）**

```ts
      await tagButton.click();
  
      // Then the number of articles per page matches the pagination setting (10 per page)
      const articlePreviewHeadings = page.locator('.article-preview h1');
      await expect(articlePreviewHeadings).toHaveCount(10);
      for (let i = 0; i < 10; i++) {
▶       await expect(articlePreviewHeadings.nth(i)).toHaveText(expectedPage1Titles[i]);
      }
  
      // When I select page 2 in the pagination bar
      const page2Button = page.getByRole('button', { name: 'Page 2', exact: true });
      await expect(page2Button).toBeVisible();
      await page2Button.click();
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅要求每頁文章數量符合分頁設定，並未要求依特定順序逐一比對第一頁的文章標題。

**為什麼公開材料不支持**（P2 核對器）：公開契約中僅驗證標籤篩選分頁的文章數量（如每頁10篇、第二頁5篇）及分頁網址，並未斷言特定順序或特定標題清單內容。

**關鍵字命中（機械 grep，僅供導航）**

- `Titles` → `docs/src/content/docs/specifications/backend/endpoints.md:185` ｜ > The `slug` is the article's URL identifier. The spec only requires it to be a unique string that you can use to fetch,
- `Titles` → `specs/api/hurl/errors_articles.hurl:110` ｜ # Duplicate titles are allowed (each gets a unique slug)


---

## P4-04 · H03 · gemini-3.8-flash · precise

`PR_gem_precise_H03_s2#1` （`generated/PR_gem_precise_H03_s2.spec.ts` 第 30 行）

**需求**

### H03 標籤篩選的分頁
（group: Conduit ▸ 文章列表｜tags: Full,Major）

```
--- steps ---
1. 準備某個標籤底下共 15 篇文章
2. 於首頁以該標籤篩選
3. 點選分頁列的第 2 頁
4. 另開一頁，直接輸入帶 page=2 的網址
5. 切回全部文章的列表
--- expect ---
每頁的文章數符合分頁設定，第二頁是接續的文章；網址會反映目前頁碼；直接輸入網址可以到達同一頁；切回全部文章時回到第一頁。
--- note ---
每頁筆數以產品預設為準。
```

**Gherkin**

```gherkin
@item:H03
    Scenario: Tag-filtered pagination
      Given there are 15 articles under a specific tag
      When the user filters by that tag on the home page
      Then the number of articles per page should match the pagination settings
      When the user selects page 2 from the pagination controls
      Then the articles displayed should be the continuation of the list
      And the URL should reflect the current page number
      When the user directly navigates to the URL with page=2 in a new page
      Then the user should arrive at the same page
      When the user switches back to the all articles list
      Then the list should return to page 1
```

**斷言（▶ 那一行）**

```ts
  
      const tagButton = page.getByRole('button', { name: uniqueTag });
      await expect(tagButton).toBeVisible();
      await tagButton.click();
  
      // 確認標籤分頁已被選取
▶     await expect(page.getByRole('button', { name: `# ${uniqueTag}` })).toBeVisible();
  
      // Then the number of articles per page should match the pagination settings
      // 預設每頁 10 篇
      const articlePreviews = page.locator('.article-preview');
      await expect(articlePreviews).toHaveCount(10);
  
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅要求篩選文章列表，未提及篩選後介面上需出現標籤分頁按鈕（# tag）。

**為什麼公開材料不支持**（P2 核對器）：公開契約與 E2E 規格中，標籤分頁的導覽項目為 a.nav-link（例如 `.nav-link:has-text(...)`），從未規定或測試過需存在一個名稱為 `# ${uniqueTag}` 的 button 元素。

**關鍵字命中（機械 grep，僅供導航）**

- `button` → `docs/src/content/docs/implementation-creation/features.md:7` ｜ - Authenticate users via JWT (login/signup pages + logout button on settings page)
- `button` → `docs/src/content/docs/specifications/frontend/routing.md:15` ｜ - Delete article button (only shown to article's author)
- `uniqueTag` → `specs/e2e/navigation.spec.ts:162` ｜ const uniqueTag = `pag${Date.now()}`;
- `uniqueTag` → `specs/e2e/url-navigation.spec.ts:113` ｜ const uniqueTag = `pag${Date.now()}`;


---

## P4-05 · H03 · gemini-3.8-flash · precise

`PR_gem_precise_H03_s2#5` （`generated/PR_gem_precise_H03_s2.spec.ts` 第 46 行）

**需求**

### H03 標籤篩選的分頁
（group: Conduit ▸ 文章列表｜tags: Full,Major）

```
--- steps ---
1. 準備某個標籤底下共 15 篇文章
2. 於首頁以該標籤篩選
3. 點選分頁列的第 2 頁
4. 另開一頁，直接輸入帶 page=2 的網址
5. 切回全部文章的列表
--- expect ---
每頁的文章數符合分頁設定，第二頁是接續的文章；網址會反映目前頁碼；直接輸入網址可以到達同一頁；切回全部文章時回到第一頁。
--- note ---
每頁筆數以產品預設為準。
```

**Gherkin**

```gherkin
@item:H03
    Scenario: Tag-filtered pagination
      Given there are 15 articles under a specific tag
      When the user filters by that tag on the home page
      Then the number of articles per page should match the pagination settings
      When the user selects page 2 from the pagination controls
      Then the articles displayed should be the continuation of the list
      And the URL should reflect the current page number
      When the user directly navigates to the URL with page=2 in a new page
      Then the user should arrive at the same page
      When the user switches back to the all articles list
      Then the list should return to page 1
```

**斷言（▶ 那一行）**

```ts
  
      // When the user selects page 2 from the pagination controls
      await page2Button.click();
  
      // Then the articles displayed should be the continuation of the list (5 篇)
      await expect(articlePreviews).toHaveCount(5);
▶     await expect(page.getByRole('button', { name: 'Page 2 is your current page' })).toBeVisible();
  
      // And the URL should reflect the current page number
      await expect(page).toHaveURL(/page=2/);
      const targetUrl = page.url();
  
      // When the user directly navigates to the URL with page=2 in a new page
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅要求第二頁顯示接續文章與網址反映頁碼，並未規範分頁控制項的無障礙名稱或目前選中狀態標籤。

**為什麼公開材料不支持**（P2 核對器）：公開契約中僅規定目前頁面使用 CSS class active（例如 .page-item.active），完全未提及或測試名為 'Page 2 is your current page' 的按鈕或無障礙名稱。

**關鍵字命中（機械 grep，僅供導航）**

- `button` → `docs/src/content/docs/implementation-creation/features.md:7` ｜ - Authenticate users via JWT (login/signup pages + logout button on settings page)
- `button` → `docs/src/content/docs/specifications/frontend/routing.md:15` ｜ - Delete article button (only shown to article's author)
- `current` → `docs/src/content/docs/specifications/backend/endpoints.md:50` ｜ ### Get Current User
- `current` → `specs/api/hurl/auth.hurl:40` ｜ # Get current user


---

## P4-06 · S02 · gemini-3.8-flash · precise

`PR_gem_precise_S02_s1#1` （`generated/PR_gem_precise_S02_s1.spec.ts` 第 19 行）

**需求**

### S02 重複 email 的註冊
（group: Conduit ▸ 帳號｜tags: Full）

```
--- steps ---
1. 以一組未使用過的 email 完成註冊
2. 登出
3. 以同一組 email 再註冊一次
--- expect ---
第二次註冊失敗並顯示錯誤，使用者未登入。
```

**Gherkin**

```gherkin
@item:S02
    Scenario: Registration with duplicate email
      Given a user has completed registration with an unused email and logged out
      When someone attempts to register again with the same email
      Then the registration fails with an error displayed
      And the user is not logged in
```

**斷言（▶ 那一行）**

```ts
      await page.getByPlaceholder('Password').fill('password123');
      await page.getByRole('button', { name: 'Sign up' }).click();
  
      // Then the registration fails with an error displayed
      const errorMessage = page.locator('.error-messages');
      await expect(errorMessage).toBeVisible();
▶     await expect(errorMessage).toContainText('email has already been taken');
  
      // And the user is not logged in
      await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
    });
  });
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅要求「顯示錯誤」而未具體指定錯誤訊息字樣，但此字樣符合 Conduit 官方規格。

**為什麼公開材料不支持**（P2 核對器）：公開契約中僅在 API 測試與範本中定義後端回傳 409 與 error-messages 容器，並未規定前端畫面錯誤訊息的具體文字必須為 'email has already been taken'。

**關鍵字命中（機械 grep，僅供導航）**

- `email` → `docs/src/content/docs/specifications/backend/api-response-format.md:14` ｜ "email": "jake@jake.jake",
- `email` → `docs/src/content/docs/specifications/backend/endpoints.md:20` ｜ "email": "jake@jake.jake",
- `already` → `docs/src/content/docs/specifications/frontend/templates.md:237` ｜ <li>That email is already taken</li>
- `already` → `specs/api/hurl/errors_auth.hurl:64` ｜ jsonpath "$.errors.username[0]" == "has already been taken"
- `taken` → `docs/src/content/docs/specifications/frontend/templates.md:237` ｜ <li>That email is already taken</li>


---

## P4-07 · S02 · gemini-3.8-flash · precise

`PR_gem_precise_S02_s2#2` （`generated/PR_gem_precise_S02_s2.spec.ts` 第 24 行）

**需求**

### S02 重複 email 的註冊
（group: Conduit ▸ 帳號｜tags: Full）

```
--- steps ---
1. 以一組未使用過的 email 完成註冊
2. 登出
3. 以同一組 email 再註冊一次
--- expect ---
第二次註冊失敗並顯示錯誤，使用者未登入。
```

**Gherkin**

```gherkin
@item:S02
    Scenario: Registration with duplicate email
      Given a user has registered with an unused email
      And has logged out
      When the user attempts to register again with the same email
      Then the registration should fail with an error displayed
      And the user should not be logged in
```

**斷言（▶ 那一行）**

```ts
      // Then the registration should fail with an error displayed
      const errorMessage = page.locator('.error-messages');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(/email.*(taken|already|has already been taken)/i);
  
      // And the user should not be logged in
▶     await expect(page).toHaveURL(/#\/register/);
      await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();
      await expect(page.getByRole('link', { name: /login|sign in/i })).toBeVisible();
    });
  });
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅要求『使用者未登入』與『註冊失敗並顯示錯誤』，未規定頁面 URL 必須停留或導向 /#/register。

**為什麼公開材料不支持**（P2 核對器）：公開材料中定義了註冊路由為 '/register' 且錯誤時停留在 '/register'（如 error-handling.spec.ts 第 64 行），但未要求或測試 hash 路由模式 '/#/register'。

**關鍵字命中（機械 grep，僅供導航）**

- `register` → `docs/src/content/docs/specifications/frontend/routing.md:9` ｜ - Sign in/Sign up pages (URL: `/login`, `/register` )
- `register` → `docs/src/content/docs/specifications/frontend/templates.md:40` ｜ - the register page


---

## P4-08 · S12 · gemini-3.8-flash · precise

`PR_gem_precise_S12_s1#1` （`generated/PR_gem_precise_S12_s1.spec.ts` 第 34 行）

**需求**

### S12 文章列表換頁
（group: Conduit ▸ 文章列表｜tags: Full）

```
--- steps ---
1. 於首頁的文章列表捲動到分頁列
2. 點選第 2 頁
--- expect ---
顯示的是接續的文章。
```

**Gherkin**

```gherkin
@item:S12
    Scenario: Article list pagination
      Given I scroll to the pagination bar in the article list on the home page
      When I select page 2
      Then the list displays the consecutive articles
```

**斷言（▶ 那一行）**

```ts
  
      // When I select page 2
      await page2Button.click();
  
      // Then the list displays the consecutive articles
      // Page 2 按鈕應成為當前頁面
▶     await expect(page.getByRole('button', { name: 'Page 2 is your current page' })).toBeVisible();
  
      // 檢查第二頁的文章內容出現
      if (expectedFirstArticlePage2) {
        await expect(page.getByRole('heading', { name: expectedFirstArticlePage2 })).toBeVisible();
      }
    });
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅要求顯示接續的文章，並未規定分頁按鈕必須呈現當前頁面狀態 Accessibility 標籤。

**為什麼公開材料不支持**（P2 核對器）：公開契約中要求分頁當前頁以 CSS class 'active' 表示，並未規定或測試名為 'Page 2 is your current page' 的按鈕或無障礙名稱。

**關鍵字命中（機械 grep，僅供導航）**

- `button` → `docs/src/content/docs/implementation-creation/features.md:7` ｜ - Authenticate users via JWT (login/signup pages + logout button on settings page)
- `button` → `docs/src/content/docs/specifications/frontend/routing.md:15` ｜ - Delete article button (only shown to article's author)
- `current` → `docs/src/content/docs/specifications/backend/endpoints.md:50` ｜ ### Get Current User
- `current` → `specs/api/hurl/auth.hurl:40` ｜ # Get current user


---

## P4-09 · S12 · gemini-3.8-flash · precise

`PR_gem_precise_S12_s2#2` （`generated/PR_gem_precise_S12_s2.spec.ts` 第 32 行）

**需求**

### S12 文章列表換頁
（group: Conduit ▸ 文章列表｜tags: Full）

```
--- steps ---
1. 於首頁的文章列表捲動到分頁列
2. 點選第 2 頁
--- expect ---
顯示的是接續的文章。
```

**Gherkin**

```gherkin
@item:S12
    Scenario: Article list pagination
      Given a user scrolls to the pagination controls on the home page article list
      When the user selects page 2
      Then the articles displayed should be the continuation of the list
```

**斷言（▶ 那一行）**

```ts
      await expect(page2Button).toBeVisible();
  
      // 點選第二頁
      await page2Button.click();
  
      // 等待第二頁按鈕變成目前頁面狀態，或確認文章列表更新
▶     await expect(page.getByRole('button', { name: 'Page 2 is your current page' })).toBeVisible();
  
      // 驗證第二頁顯示的文章與第一頁不同（是接續的清單）
      const page2Articles = await articleHeadings.allTextContents();
      expect(page2Articles.length).toBeGreaterThan(0);
      expect(page2Articles).not.toEqual(page1Articles);
  
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅要求顯示接續的文章，並未主張分頁按鈕需呈現特定無障礙狀態文字（'Page 2 is your current page'）。

**為什麼公開材料不支持**（P2 核對器）：公開材料中對於分頁當前頁面的樣式僅規定使用 CSS 類別 `.page-item.active`，並未定義或測試包含 'Page 2 is your current page' 的 accessible name 或 aria-label 按鈕。

**關鍵字命中（機械 grep，僅供導航）**

- `button` → `docs/src/content/docs/implementation-creation/features.md:7` ｜ - Authenticate users via JWT (login/signup pages + logout button on settings page)
- `button` → `docs/src/content/docs/specifications/frontend/routing.md:15` ｜ - Delete article button (only shown to article's author)
- `current` → `docs/src/content/docs/specifications/backend/endpoints.md:50` ｜ ### Get Current User
- `current` → `specs/api/hurl/auth.hurl:40` ｜ # Get current user


---

## P4-10 · S12 · gemini-3.8-flash · precise

`PR_gem_precise_S12_s3#2` （`generated/PR_gem_precise_S12_s3.spec.ts` 第 26 行）

**需求**

### S12 文章列表換頁
（group: Conduit ▸ 文章列表｜tags: Full）

```
--- steps ---
1. 於首頁的文章列表捲動到分頁列
2. 點選第 2 頁
--- expect ---
顯示的是接續的文章。
```

**Gherkin**

```gherkin
@item:S12
    Scenario: Article list pagination
      Given a user views the article list on the home page and scrolls to the pagination controls
      When the user selects page 2
      Then the subsequent articles are displayed
```

**斷言（▶ 那一行）**

```ts
      const page2Button = page.getByRole('button', { name: 'Page 2' });
      await page2Button.scrollIntoViewIfNeeded();
      await page2Button.click();
  
      // Then the subsequent articles are displayed
      const page2CurrentButton = page.getByRole('button', { name: 'Page 2 is your current page' });
▶     await expect(page2CurrentButton).toBeVisible();
  
      // Verify articles updated on page 2
      await expect(page.locator('.article-preview h1').first()).not.toHaveText(firstArticleOnPage1);
    });
  });
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅主張換頁後『顯示的是接續的文章』，未提及分頁按鈕自身選中狀態的可見性。

**為什麼公開材料不支持**（P2 核對器）：公開材料中分頁元件僅定義了 .pagination、.page-item.active 或 ?page=N，並無任何關於特定無障礙名稱（如 'Page 2 is your current page'）或按鈕文字角色的規範或測試。

**關鍵字命中**：無


---

## P4-11 · H01 · gemini-3.8-flash · concise

`PR_gem_terse_H01_s1#3` （`generated/PR_gem_terse_H01_s1.spec.ts` 第 44 行）

**需求**

### H01 文章標籤與編輯
（group: Conduit ▸ 文章｜tags: Full,Major）

```
--- steps ---
1. 以已登入的使用者進入新增文章頁
2. 填入標題與內文，加入三個標籤後發佈
3. 在該文章頁點選編輯
4. 將標題改成另一個字串，並把標籤全部移除後送出
--- expect ---
文章頁的內容與輸入一致；編輯送出後頁面跟著更新。
--- note ---
標籤取三個是為了覆蓋多標籤的顯示。
```

**Gherkin**

```gherkin
@item:H01
    Scenario: Article tagging and editing
      Given a user is logged in
      And the user goes to the new article page
      When the user fills in the title and body, adds three tags, and publishes the article
      Then the article page content should match the entered information
      When the user clicks edit on the article page
      And the user changes the title to a different string, removes all tags, and submits
      Then the article page should update accordingly
```

**斷言（▶ 那一行）**

```ts
      // When the user clicks edit on the article page
      await page.getByRole('link', { name: /Edit Article/i }).first().click();
  
      // And the user changes the title to a different string, removes all tags, and submits
      const title2 = `Updated Title ${Date.now()}`;
      const titleInput = page.getByRole('textbox', { name: 'Article Title' });
▶     await expect(titleInput).toHaveValue(title1);
      await titleInput.fill(title2);
  
      // Remove all tags in editor
      const removeTagButtons = page.locator('.tag-list i, .tag-default i, [class*="ion-close"], [class*="ion-trash"]');
      while ((await removeTagButtons.count()) > 0) {
        await removeTagButtons.first().click();
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅要求點選編輯並修改標題送出，未明文規定進入編輯頁時輸入框初始值必須等於原標題。

**為什麼公開材料不支持**（P2 核對器）：公開契約中僅在編輯頁面載入時檢查 title 輸入框不為空（not.toHaveValue('')）或特定字串，並未規定或斷言編輯文章時 title 欄位必須精確預先填入先前的標題值。

**關鍵字命中（機械 grep，僅供導航）**

- `titleInput` → `specs/e2e/articles.spec.ts:247` ｜ const titleInput = page.locator('input[name="title"]');
- `title` → `docs/src/content/docs/implementation-creation/expectations.md:2` ｜ title: Expectations
- `title` → `docs/src/content/docs/implementation-creation/features.md:2` ｜ title: Features


---

## P4-12 · H02 · gemini-3.8-flash · concise

`PR_gem_terse_H02_s1#6` （`generated/PR_gem_terse_H02_s1.spec.ts` 第 33 行）

**需求**

### H02 文章頁的可見性與權限
（group: Conduit ▸ 文章｜tags: Full,Major）

```
--- steps ---
1. 以作者身分建立一篇文章，並在該文章下留一則留言
2. 以未登入的訪客開啟該文章頁
3. 以另一位已登入、非作者的使用者開啟同一頁
4. 該使用者在同一頁留下自己的留言
--- expect ---
不同身分在同一頁看到的東西不一樣，可做的操作也不一樣。
--- note ---
只驗畫面上看得到什麼，不含 API 層的權限。
```

**Gherkin**

```gherkin
@item:H02
    Scenario: Article page visibility and permissions
      Given an author creates an article and leaves a comment under it
      When an unauthenticated visitor opens the article page
      Then what the visitor sees and the actions they can perform should differ based on their role
      When another logged-in user who is not the author opens the same page
      And this user leaves their own comment on the page
      Then what this user sees and the actions they can perform should differ based on their role
```

**斷言（▶ 那一行）**

```ts
      await expect(page.getByText(authorCommentText)).toBeVisible();
  
      // Visitor cannot edit/delete article or post comments; sees sign in / sign up prompts instead
      await expect(page.getByRole('button', { name: /Delete Article/i })).toHaveCount(0);
      await expect(page.getByRole('link', { name: /Edit Article/i })).toHaveCount(0);
      await expect(page.getByPlaceholder('Write a comment...')).toHaveCount(0);
▶     await expect(page.getByRole('button', { name: 'Post Comment' })).toHaveCount(0);
      await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
  
      // Visitor should not see comment delete buttons (mod-options)
      await expect(page.locator('.mod-options')).toHaveCount(0);
  
      // 4. When another logged-in user who is not the author opens the same page
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅抽象提及不同身分可做的操作不一樣，未具體規定未登入訪客看不到 'Post Comment' 按鈕，但此行為可由 Conduit 公開規格導出。

**為什麼公開材料不支持**（P2 核對器）：公開契約中僅測試未登入訪客看不到留言輸入框 textarea 或看到登入連結，未明確陳述或斷言不可看見 Post Comment 按鈕。

**關鍵字命中（機械 grep，僅供導航）**

- `button` → `docs/src/content/docs/implementation-creation/features.md:7` ｜ - Authenticate users via JWT (login/signup pages + logout button on settings page)
- `button` → `docs/src/content/docs/specifications/frontend/routing.md:15` ｜ - Delete article button (only shown to article's author)
- `Post Comment` → `docs/src/content/docs/specifications/frontend/templates.md:566` ｜ <button class="btn btn-sm btn-primary">Post Comment</button>
- `Post Comment` → `specs/api/hurl/errors_comments.hurl:1` ｜ # Post comment no auth
- `Comment` → `docs/src/content/docs/implementation-creation/features.md:10` ｜ - CR-D Comments on articles (no updating required)


---

## P4-13 · H02 · gemini-3.8-flash · concise

`PR_gem_terse_H02_s3#0` （`generated/PR_gem_terse_H02_s3.spec.ts` 第 21 行）

**需求**

### H02 文章頁的可見性與權限
（group: Conduit ▸ 文章｜tags: Full,Major）

```
--- steps ---
1. 以作者身分建立一篇文章，並在該文章下留一則留言
2. 以未登入的訪客開啟該文章頁
3. 以另一位已登入、非作者的使用者開啟同一頁
4. 該使用者在同一頁留下自己的留言
--- expect ---
不同身分在同一頁看到的東西不一樣，可做的操作也不一樣。
--- note ---
只驗畫面上看得到什麼，不含 API 層的權限。
```

**Gherkin**

```gherkin
@item:H02
    Scenario: Article page visibility and permissions
      Given an author creates an article and leaves a comment on it
      When an unauthenticated visitor opens the article page
      Then what is visible and the available actions differ based on the role
      When another logged-in, non-author user opens the same page
      And this user leaves their own comment on the page
      Then what is visible and the available actions differ based on the role
```

**斷言（▶ 那一行）**

```ts
      // When an unauthenticated visitor opens the article page
      await page.goto(`${UI}/#/article/${article.slug}`);
  
      // Then what is visible and the available actions differ based on the role
      // Unauthenticated visitor:
      // - Should see author's comment
▶     await expect(page.getByText(authorCommentText)).toBeVisible();
      // - Should NOT see Edit Article or Delete Article buttons
      await expect(page.getByRole('button', { name: /Delete Article/i })).toHaveCount(0);
      await expect(page.getByRole('link', { name: /Edit Article/i })).toHaveCount(0);
      // - Should NOT see comment textarea
      await expect(page.getByPlaceholder('Write a comment...')).toHaveCount(0);
      // - Should see prompt to sign in or sign up
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅抽象陳述『不同身分看到的東西不一樣』，並未明確指定訪客能看見作者留言，但符合 RealWorld 公開規格。

**為什麼公開材料不支持**（P2 核對器）：公開材料中未明確要求或測試未登入訪客瀏覽文章頁時必須可見作者先前留下的留言內容。

**關鍵字命中**：無


---

## P4-14 · H02 · gemini-3.8-flash · concise

`PR_gem_terse_H02_s3#5` （`generated/PR_gem_terse_H02_s3.spec.ts` 第 29 行）

**需求**

### H02 文章頁的可見性與權限
（group: Conduit ▸ 文章｜tags: Full,Major）

```
--- steps ---
1. 以作者身分建立一篇文章，並在該文章下留一則留言
2. 以未登入的訪客開啟該文章頁
3. 以另一位已登入、非作者的使用者開啟同一頁
4. 該使用者在同一頁留下自己的留言
--- expect ---
不同身分在同一頁看到的東西不一樣，可做的操作也不一樣。
--- note ---
只驗畫面上看得到什麼，不含 API 層的權限。
```

**Gherkin**

```gherkin
@item:H02
    Scenario: Article page visibility and permissions
      Given an author creates an article and leaves a comment on it
      When an unauthenticated visitor opens the article page
      Then what is visible and the available actions differ based on the role
      When another logged-in, non-author user opens the same page
      And this user leaves their own comment on the page
      Then what is visible and the available actions differ based on the role
```

**斷言（▶ 那一行）**

```ts
      await expect(page.getByRole('button', { name: /Delete Article/i })).toHaveCount(0);
      await expect(page.getByRole('link', { name: /Edit Article/i })).toHaveCount(0);
      // - Should NOT see comment textarea
      await expect(page.getByPlaceholder('Write a comment...')).toHaveCount(0);
      // - Should see prompt to sign in or sign up
      await expect(page.getByRole('link', { name: 'Sign in' }).first()).toBeVisible();
▶     await expect(page.getByText('to add comments on this article.')).toBeVisible();
      // - Should not see delete comment button
      await expect(page.locator('.ion-trash-a, .mod-options i, button i.ion-trash-a')).toHaveCount(0);
  
      // When another logged-in, non-author user opens the same page
      const reader = await newUser();
      await loginAs(page, reader);
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅抽象提及不同身分看到與可操作的內容不同，未具體規定訪客應看到提示登入留言的文案，但此為 RealWorld 規範中的標準行為。

**為什麼公開材料不支持**（P2 核對器）：公開材料（包含 templates.md、SELECTORS.md 及 e2e 測試）均未提及或要求 'to add comments on this article.' 這段文字。

**關鍵字命中（機械 grep，僅供導航）**

- `comments` → `docs/src/content/docs/implementation-creation/features.md:10` ｜ - CR-D Comments on articles (no updating required)
- `comments` → `docs/src/content/docs/specifications/backend/api-response-format.md:125` ｜ ### Multiple Comments
- `article` → `docs/src/content/docs/implementation-creation/features.md:9` ｜ - CRUD Articles
- `article` → `docs/src/content/docs/specifications/backend/api-response-format.md:36` ｜ ### Single Article


---

## P4-15 · H03 · gemini-3.8-flash · concise

`PR_gem_terse_H03_s1#0` （`generated/PR_gem_terse_H03_s1.spec.ts` 第 23 行）

**需求**

### H03 標籤篩選的分頁
（group: Conduit ▸ 文章列表｜tags: Full,Major）

```
--- steps ---
1. 準備某個標籤底下共 15 篇文章
2. 於首頁以該標籤篩選
3. 點選分頁列的第 2 頁
4. 另開一頁，直接輸入帶 page=2 的網址
5. 切回全部文章的列表
--- expect ---
分頁行為符合設定，換頁後看得到後續的文章，網址跟著變。
--- note ---
每頁筆數以產品預設為準。
```

**Gherkin**

```gherkin
@item:H03
    Scenario: Tag filtering pagination
      Given there are 15 articles under a specific tag
      When the user filters by that tag on the home page
      And the user clicks page 2 in the pagination bar
      Then the pagination behavior should match the configuration, showing subsequent articles and updating the URL
      When the user opens a new page and directly enters the URL with page=2
      Then the pagination behavior should match the configuration, showing subsequent articles
      When the user switches back to the all articles list
      Then the pagination behavior should match the configuration
```

**斷言（▶ 那一行）**

```ts
  
      // When the user filters by that tag on the home page
      await page.goto(`${UI}/#/`);
      await page.getByRole('button', { name: uniqueTag }).click();
  
      // Verify tag feed is active and first page articles are displayed
▶     await expect(page.getByRole('button', { name: uniqueTag, exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Page 1 is your current page' })).toBeVisible();
  
      // And the user clicks page 2 in the pagination bar
      await page.getByRole('button', { name: 'Page 2' }).click();
  
      // Then the pagination behavior should match the configuration, showing subsequent articles and updating the URL
```

**為什麼需求／Gherkin 不支持**（主判定器）：點選標籤篩選後確認該標籤按鈕維持可見，驗收要求與 Gherkin 均未提及標籤選取狀態或標籤按鈕的可見性。

**為什麼公開材料不支持**（P2 核對器）：公開契約中要求標籤分頁以鏈結/導覽（.nav-link 或 a）呈現，而非特定名為 tag 的 button 元素可見性斷言。

**關鍵字命中（機械 grep，僅供導航）**

- `button` → `docs/src/content/docs/implementation-creation/features.md:7` ｜ - Authenticate users via JWT (login/signup pages + logout button on settings page)
- `button` → `docs/src/content/docs/specifications/frontend/routing.md:15` ｜ - Delete article button (only shown to article's author)
- `uniqueTag` → `specs/e2e/navigation.spec.ts:162` ｜ const uniqueTag = `pag${Date.now()}`;
- `uniqueTag` → `specs/e2e/url-navigation.spec.ts:113` ｜ const uniqueTag = `pag${Date.now()}`;


---

## P4-16 · H03 · gemini-3.8-flash · concise

`PR_gem_terse_H03_s1#1` （`generated/PR_gem_terse_H03_s1.spec.ts` 第 24 行）

**需求**

### H03 標籤篩選的分頁
（group: Conduit ▸ 文章列表｜tags: Full,Major）

```
--- steps ---
1. 準備某個標籤底下共 15 篇文章
2. 於首頁以該標籤篩選
3. 點選分頁列的第 2 頁
4. 另開一頁，直接輸入帶 page=2 的網址
5. 切回全部文章的列表
--- expect ---
分頁行為符合設定，換頁後看得到後續的文章，網址跟著變。
--- note ---
每頁筆數以產品預設為準。
```

**Gherkin**

```gherkin
@item:H03
    Scenario: Tag filtering pagination
      Given there are 15 articles under a specific tag
      When the user filters by that tag on the home page
      And the user clicks page 2 in the pagination bar
      Then the pagination behavior should match the configuration, showing subsequent articles and updating the URL
      When the user opens a new page and directly enters the URL with page=2
      Then the pagination behavior should match the configuration, showing subsequent articles
      When the user switches back to the all articles list
      Then the pagination behavior should match the configuration
```

**斷言（▶ 那一行）**

```ts
      // When the user filters by that tag on the home page
      await page.goto(`${UI}/#/`);
      await page.getByRole('button', { name: uniqueTag }).click();
  
      // Verify tag feed is active and first page articles are displayed
      await expect(page.getByRole('button', { name: uniqueTag, exact: true })).toBeVisible();
▶     await expect(page.getByRole('button', { name: 'Page 1 is your current page' })).toBeVisible();
  
      // And the user clicks page 2 in the pagination bar
      await page.getByRole('button', { name: 'Page 2' }).click();
  
      // Then the pagination behavior should match the configuration, showing subsequent articles and updating the URL
      await expect(page).toHaveURL(new RegExp(`tag=${uniqueTag}.*page=2|page=2.*tag=${uniqueTag}`));
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 均未明確斷言篩選後第一頁分頁按鈕的當前選中可見狀態（Page 1 is your current page）。

**為什麼公開材料不支持**（P2 核對器）：公開契約中要求的分頁按鈕格式為 .page-item.active 配合 .page-link 或包含數字文本，從未規範或測試 'Page 1 is your current page' 的 accessible name 或 aria-label。

**關鍵字命中（機械 grep，僅供導航）**

- `button` → `docs/src/content/docs/implementation-creation/features.md:7` ｜ - Authenticate users via JWT (login/signup pages + logout button on settings page)
- `button` → `docs/src/content/docs/specifications/frontend/routing.md:15` ｜ - Delete article button (only shown to article's author)
- `current` → `docs/src/content/docs/specifications/backend/endpoints.md:50` ｜ ### Get Current User
- `current` → `specs/api/hurl/auth.hurl:40` ｜ # Get current user


---

## P4-17 · H03 · gemini-3.8-flash · concise

`PR_gem_terse_H03_s3#1` （`generated/PR_gem_terse_H03_s3.spec.ts` 第 29 行）

**需求**

### H03 標籤篩選的分頁
（group: Conduit ▸ 文章列表｜tags: Full,Major）

```
--- steps ---
1. 準備某個標籤底下共 15 篇文章
2. 於首頁以該標籤篩選
3. 點選分頁列的第 2 頁
4. 另開一頁，直接輸入帶 page=2 的網址
5. 切回全部文章的列表
--- expect ---
分頁行為符合設定，換頁後看得到後續的文章，網址跟著變。
--- note ---
每頁筆數以產品預設為準。
```

**Gherkin**

```gherkin
@item:H03
    Scenario: Pagination for tag filtering
      Given there are 15 articles under a specific tag
      When the user filters by that tag on the home page
      And the user clicks page 2 in the pagination bar
      Then the pagination behavior matches the settings, subsequent articles are visible, and the URL changes accordingly
      When the user opens another page and directly enters the URL with page=2
      Then the pagination behavior matches the settings, subsequent articles are visible, and the URL changes accordingly
      When the user switches back to the all articles list
      Then the pagination behavior matches the settings, subsequent articles are visible, and the URL changes accordingly
```

**斷言（▶ 那一行）**

```ts
      // When the user filters by that tag on the home page
      const tagButton = page.getByRole('button', { name: tag });
      await expect(tagButton).toBeVisible();
      await tagButton.click();
  
      // Verify tag feed is active and URL has updated (tag parameter)
▶     await expect(page).toHaveURL(new RegExp(`tag=${tag}`));
      const pagination = page.getByRole('navigation', { name: 'Pagination' });
      await expect(pagination).toBeVisible();
  
      // And the user clicks page 2 in the pagination bar
      const page2Button = pagination.getByRole('button', { name: '2', exact: true });
      await expect(page2Button).toBeVisible();
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅在分頁換頁後主張網址跟著變，未要求以標籤篩選時 URL 必須帶有 tag 參數。

**為什麼公開材料不支持**（P2 核對器）：公開契約中前端標籤篩選的路由定義為 /tag/:tag 或 /tag/:tag?page=N，而非以 query 參數 tag=${tag} 形式表示。

**關鍵字命中（機械 grep，僅供導航）**

- `tag=` → `docs/src/content/docs/specifications/backend/endpoints.md:108` ｜ `?tag=AngularJS`
- `tag=` → `specs/api/hurl/articles.hurl:120` ｜ GET {{host}}/api/articles?tag=d_{{uid}}
- `RegExp` → `specs/e2e/settings.spec.ts:48` ｜ await expect(page).toHaveURL(new RegExp(`/profile/${user.username}`));
- `RegExp` → `specs/e2e/url-navigation.spec.ts:132` ｜ await expect(page).toHaveURL(new RegExp(`/tag/${uniqueTag}\\?page=2`));


---

## P4-18 · H04 · gemini-3.8-flash · concise

`PR_gem_terse_H04_s1#6` （`generated/PR_gem_terse_H04_s1.spec.ts` 第 45 行）

**需求**

### H04 追蹤與取消追蹤
（group: Conduit ▸ 社群｜tags: Full,Major）

```
--- steps ---
1. 以使用者 B 開啟作者 A 的個人頁並點選追蹤
2. 回到首頁切換到 Your Feed
3. 回到 A 的個人頁點選取消追蹤
4. 再次切換到 Your Feed
--- expect ---
追蹤後按鈕與 Your Feed 反映這個狀態；取消追蹤後回到原本的樣子。
```

**Gherkin**

```gherkin
@item:H04
    Scenario: Follow and unfollow
      Given User B opens Author A's profile page and clicks follow
      When User B goes to the home page and switches to Your Feed
      Then the button and Your Feed should reflect this state
      When User B returns to Author A's profile page and clicks unfollow
      And User B switches to Your Feed again
      Then the state should return to what it was originally
```

**斷言（▶ 那一行）**

```ts
      // And User B switches to Your Feed again
      await page.goto(`${UI}/#/`);
      await yourFeedTab.click();
  
      // Then the state should return to what it was originally
      await expect(page.getByRole('heading', { name: article.title })).toBeHidden();
▶     await expect(page.getByText('Articles not available.')).toBeVisible();
    });
  });
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅要求取消追蹤後 Your Feed 回到原本的樣子（看不到該文章），但未具體規範空列表需顯示 'Articles not available.' 字樣。

**為什麼公開材料不支持**（P2 核對器）：公開契約中僅有 .empty-feed-message 需包含 'Your feed is empty'（或一般稱 No articles here），並無任何要求或測試斷言為 'Articles not available.'。

**關鍵字命中（機械 grep，僅供導航）**

- `Articles` → `docs/src/content/docs/implementation-creation/features.md:9` ｜ - CRUD Articles
- `Articles` → `docs/src/content/docs/specifications/backend/api-response-format.md:60` ｜ ### Multiple Articles
- `available` → `docs/src/content/docs/specifications/frontend/api.md:23` ｜ The API is freely available for public usage but its access is limited to RealWorld usage only: you won't be able to con
- `available` → `specs/e2e/SELECTORS.md:184` ｜ getAuthState(): 'authenticated' | 'unauthenticated' | 'unavailable' | 'loading';


---

## P4-19 · S02 · gemini-3.8-flash · concise

`PR_gem_terse_S02_s1#1` （`generated/PR_gem_terse_S02_s1.spec.ts` 第 21 行）

**需求**

### S02 重複 email 的註冊
（group: Conduit ▸ 帳號｜tags: Full）

```
--- steps ---
1. 以一組未使用過的 email 完成註冊
2. 登出
3. 以同一組 email 再註冊一次
--- expect ---
第二次註冊不會成功。
```

**Gherkin**

```gherkin
@item:S02
    Scenario: Registration with a duplicate email
      Given a user completes registration with an unused email
      And the user logs out
      When the user attempts to register again with the same email
      Then the second registration should not succeed
```

**斷言（▶ 那一行）**

```ts
      await page.getByRole('textbox', { name: 'Password' }).fill('password123');
      await page.getByRole('button', { name: 'Sign up' }).click();
  
      // Then the second registration should not succeed
      // Verify that an error message appears and the URL does not transition away from register
      await expect(page.locator('.error-messages')).toBeVisible();
▶     await expect(page).toHaveURL(/#\/register/);
    });
  });
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅要求「第二次註冊不會成功」，未具體規定頁面 URL 必須停留在 /#/register。

**為什麼公開材料不支持**（P2 核對器）：公開契約中未要求或測試註冊失敗時 URL 必須維持在包含 hash 路由的 /#/register。

**關鍵字命中（機械 grep，僅供導航）**

- `register` → `docs/src/content/docs/specifications/frontend/routing.md:9` ｜ - Sign in/Sign up pages (URL: `/login`, `/register` )
- `register` → `docs/src/content/docs/specifications/frontend/templates.md:40` ｜ - the register page


---

## P4-20 · S02 · gemini-3.8-flash · concise

`PR_gem_terse_S02_s2#0` （`generated/PR_gem_terse_S02_s2.spec.ts` 第 21 行）

**需求**

### S02 重複 email 的註冊
（group: Conduit ▸ 帳號｜tags: Full）

```
--- steps ---
1. 以一組未使用過的 email 完成註冊
2. 登出
3. 以同一組 email 再註冊一次
--- expect ---
第二次註冊不會成功。
```

**Gherkin**

```gherkin
@item:S02
    Scenario: Registration with duplicate email
      Given a user completes registration with an unused email
      And the user logs out
      When the user registers again with the same email
      Then the second registration should not succeed
```

**斷言（▶ 那一行）**

```ts
      await page.getByPlaceholder('Email').fill(existingUser.email);
      await page.getByPlaceholder('Password').fill('password123');
      await page.getByRole('button', { name: 'Sign up' }).click();
  
      // Then the second registration should not succeed
      // Verify that we remain on the register page and/or an error message is displayed
▶     await expect(page).toHaveURL(/#\/register/);
      await expect(page.locator('.error-messages')).toBeVisible();
      await expect(page.locator('.error-messages')).toContainText(/email/i);
    });
  });
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅說明第二次註冊不會成功，並未具體規定頁面必須停留在 /#/register，但此行為可由標準 SPA 註冊失敗流程推出。

**為什麼公開材料不支持**（P2 核對器）：公開材料中定義的路由為 '/register' 而非包含 hash 的 '/#/register'，且未規範註冊失敗時必須保持在特定 URL 模式。

**關鍵字命中（機械 grep，僅供導航）**

- `register` → `docs/src/content/docs/specifications/frontend/routing.md:9` ｜ - Sign in/Sign up pages (URL: `/login`, `/register` )
- `register` → `docs/src/content/docs/specifications/frontend/templates.md:40` ｜ - the register page


---

## P4-21 · S12 · gemini-3.8-flash · concise

`PR_gem_terse_S12_s1#1` （`generated/PR_gem_terse_S12_s1.spec.ts` 第 19 行）

**需求**

### S12 文章列表換頁
（group: Conduit ▸ 文章列表｜tags: Full）

```
--- steps ---
1. 於首頁的文章列表捲動到分頁列
2. 點選第 2 頁
--- expect ---
換頁後看到的是不一樣的文章。
```

**Gherkin**

```gherkin
@item:S12
    Scenario: Article list pagination
      Given the user scrolls to the pagination bar on the home page article list
      When the user clicks page 2
      Then the user should see different articles after changing the page
```

**斷言（▶ 那一行）**

```ts
      // Scroll to the pagination bar and click page 2
      const page2Button = page.getByRole('button', { name: 'Page 2' });
      await page2Button.scrollIntoViewIfNeeded();
      await page2Button.click();
  
      // Wait for page 2 to become the current page
▶     await expect(page.getByRole('button', { name: 'Page 2 is your current page' })).toBeVisible();
  
      // Verify articles are loaded and are different from page 1
      await expect(articleHeadings.first()).toBeVisible();
      const pageTwoTitles = await articleHeadings.allTextContents();
  
      expect(pageTwoTitles).not.toEqual(pageOneTitles);
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅要求換頁後看到不一樣的文章，未主張分頁按鈕需顯示為目前頁面狀態。

**為什麼公開材料不支持**（P2 核對器）：公開契約中要求分頁按鈕使用 .page-item.active 樣式或連結文字，從未規範或測試過名為 'Page 2 is your current page' 的無障礙名稱或文字按鈕。

**關鍵字命中（機械 grep，僅供導航）**

- `button` → `docs/src/content/docs/implementation-creation/features.md:7` ｜ - Authenticate users via JWT (login/signup pages + logout button on settings page)
- `button` → `docs/src/content/docs/specifications/frontend/routing.md:15` ｜ - Delete article button (only shown to article's author)
- `current` → `docs/src/content/docs/specifications/backend/endpoints.md:50` ｜ ### Get Current User
- `current` → `specs/api/hurl/auth.hurl:40` ｜ # Get current user


---

## P4-22 · S12 · gemini-3.8-flash · concise

`PR_gem_terse_S12_s2#3` （`generated/PR_gem_terse_S12_s2.spec.ts` 第 23 行）

**需求**

### S12 文章列表換頁
（group: Conduit ▸ 文章列表｜tags: Full）

```
--- steps ---
1. 於首頁的文章列表捲動到分頁列
2. 點選第 2 頁
--- expect ---
換頁後看到的是不一樣的文章。
```

**Gherkin**

```gherkin
@item:S12
    Scenario: Article list pagination
      Given the user scrolls to the pagination bar on the home page article list
      When the user clicks page 2
      Then different articles should be displayed after changing pages
```

**斷言（▶ 那一行）**

```ts
      await expect(page2Button).toBeVisible();
  
      // When the user clicks page 2
      await page2Button.click();
  
      // Then different articles should be displayed after changing pages
▶     await expect(page.getByRole('button', { name: 'Page 2 is your current page' })).toBeVisible();
  
      const page2Articles = await articleHeadings.allInnerTexts();
      expect(page2Articles.length).toBeGreaterThan(0);
      expect(page2Articles).not.toEqual(page1Articles);
    });
  });
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅要求換頁後看到不同的文章，並未要求分頁按鈕需處於當前頁（current page）狀態。

**為什麼公開材料不支持**（P2 核對器）：公開契約中要求分頁項使用 active 類別（.page-item.active），完全未提及或測試按鈕需要具備 'Page 2 is your current page' 的 accessible name 或 aria 標籤。

**關鍵字命中（機械 grep，僅供導航）**

- `button` → `docs/src/content/docs/implementation-creation/features.md:7` ｜ - Authenticate users via JWT (login/signup pages + logout button on settings page)
- `button` → `docs/src/content/docs/specifications/frontend/routing.md:15` ｜ - Delete article button (only shown to article's author)
- `current` → `docs/src/content/docs/specifications/backend/endpoints.md:50` ｜ ### Get Current User
- `current` → `specs/api/hurl/auth.hurl:40` ｜ # Get current user


---

## P4-23 · S12 · gemini-3.8-flash · concise

`PR_gem_terse_S12_s3#2` （`generated/PR_gem_terse_S12_s3.spec.ts` 第 23 行）

**需求**

### S12 文章列表換頁
（group: Conduit ▸ 文章列表｜tags: Full）

```
--- steps ---
1. 於首頁的文章列表捲動到分頁列
2. 點選第 2 頁
--- expect ---
換頁後看到的是不一樣的文章。
```

**Gherkin**

```gherkin
@item:S12
    Scenario: Article list pagination
      Given the user is on the article list on the home page
      When the user scrolls to the pagination bar and clicks page 2
      Then different articles are displayed after changing the page
```

**斷言（▶ 那一行）**

```ts
      // When the user scrolls to the pagination bar and clicks page 2
      const page2Button = paginationNav.getByRole('button', { name: '2', exact: true });
      await page2Button.scrollIntoViewIfNeeded();
      await page2Button.click();
  
      // 等待分頁切換後內容更新
▶     await expect(page2Button).toHaveAttribute('aria-current', 'page').catch(async () => {
        // 若沒有 aria-current，確保第 1 頁與第 2 頁文章內容有所變更
      });
  
      // Then different articles are displayed after changing the page
      await expect(async () => {
        const secondPageHeadings = await articleHeadings.allInnerTexts();
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅要求換頁後看到不同的文章，並未要求分頁按鈕必須具備 aria-current 屬性。

**為什麼公開材料不支持**（P2 核對器）：公開契約與 E2E 規格中僅約定使用 .page-item.active 樣式類表示分頁啟動狀態，未要求或測試 aria-current='page' 屬性。

**關鍵字命中（機械 grep，僅供導航）**

- `page` → `docs/src/content/docs/implementation-creation/features.md:7` ｜ - Authenticate users via JWT (login/signup pages + logout button on settings page)
- `page` → `docs/src/content/docs/specifications/backend/introduction.md:10` ｜ These pages summarize the contract in prose, but the [OpenAPI spec](https://github.com/realworld-apps/realworld/blob/mai
- `toHaveAttribute` → `specs/e2e/null-fields.spec.ts:85` ｜ await expect(profileImg).toHaveAttribute('src', testImage);
- `toHaveAttribute` → `specs/e2e/url-navigation.spec.ts:59` ｜ await expect(yourFeedLink).toHaveAttribute('href', '/?feed=following');
- `catch` → `specs/e2e/url-navigation.spec.ts:170` ｜ const hasPage2 = await page2Button.isVisible().catch(() => false);


---

## P4-24 · H03 · gpt-5.6-terra · precise

`PR_terra_precise_H03_s1#12` （`generated/PR_terra_precise_H03_s1.spec.ts` 第 65 行）

**需求**

### H03 標籤篩選的分頁
（group: Conduit ▸ 文章列表｜tags: Full,Major）

```
--- steps ---
1. 準備某個標籤底下共 15 篇文章
2. 於首頁以該標籤篩選
3. 點選分頁列的第 2 頁
4. 另開一頁，直接輸入帶 page=2 的網址
5. 切回全部文章的列表
--- expect ---
每頁的文章數符合分頁設定，第二頁是接續的文章；網址會反映目前頁碼；直接輸入網址可以到達同一頁；切回全部文章時回到第一頁。
--- note ---
每頁筆數以產品預設為準。
```

**Gherkin**

```gherkin
@item:H03
    Scenario: Pagination under tag filter
      Given there are 15 articles under a specific tag
      When I filter by this tag on the home page
      Then the number of articles per page matches the pagination setting
      When I select page 2 in the pagination bar
      Then the second page displays the consecutive articles
      And the URL reflects the current page number
      When I open a new page directly with the URL containing page=2
      Then I arrive at the same page
      When I switch back to the all articles list
      Then the list returns to the first page
```

**斷言（▶ 那一行）**

```ts
  
    const globalFeedLink = page.getByRole('link', { name: 'Global Feed', exact: true });
    await expect(globalFeedLink).toBeVisible();
    await globalFeedLink.click();
  
    await expect(page).toHaveURL(new RegExp(`${UI.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/#/?$`));
▶   await expect(articlePreviews).toHaveCount(10);
    await expect(page.getByRole('link', { name: '1', exact: true })).toHaveClass(/active/);
  });
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求只說明切回全部文章時回到第一頁且每頁筆數以預設為準，未直接或在 Gherkin 中明訂切回後的全局文章數量為 10 篇，但 10 篇符合 Conduit 公開預設分頁大小。

**為什麼公開材料不支持**（P2 核對器）：公開材料僅在切回 Global Feed 時驗證 URL 回到根路徑與預覽存在（url-navigation.spec.ts:227-231），並未明文要求或斷言切回 Global Feed 後文章數量必須恰好為 10 篇。

**關鍵字命中**：無


---

## P4-25 · H03 · gpt-5.6-terra · precise

`PR_terra_precise_H03_s2#1` （`generated/PR_terra_precise_H03_s2.spec.ts` 第 30 行）

**需求**

### H03 標籤篩選的分頁
（group: Conduit ▸ 文章列表｜tags: Full,Major）

```
--- steps ---
1. 準備某個標籤底下共 15 篇文章
2. 於首頁以該標籤篩選
3. 點選分頁列的第 2 頁
4. 另開一頁，直接輸入帶 page=2 的網址
5. 切回全部文章的列表
--- expect ---
每頁的文章數符合分頁設定，第二頁是接續的文章；網址會反映目前頁碼；直接輸入網址可以到達同一頁；切回全部文章時回到第一頁。
--- note ---
每頁筆數以產品預設為準。
```

**Gherkin**

```gherkin
@item:H03
    Scenario: Tag-filtered pagination
      Given there are 15 articles under a specific tag
      When the user filters by that tag on the home page
      Then the number of articles per page should match the pagination settings
      When the user selects page 2 from the pagination controls
      Then the articles displayed should be the continuation of the list
      And the URL should reflect the current page number
      When the user directly navigates to the URL with page=2 in a new page
      Then the user should arrive at the same page
      When the user switches back to the all articles list
      Then the list should return to page 1
```

**斷言（▶ 那一行）**

```ts
      await page.goto(`${UI}/#/`);
  
      const tagLink = page.getByRole('link', { name: tag, exact: true }).first();
      await expect(tagLink).toBeVisible();
      await tagLink.click();
  
▶     await expect(page).toHaveURL(new RegExp(`#/\\?tag=${encodeURIComponent(tag)}`));
  
      const articlePreviews = page.locator('.article-preview');
      await expect(articlePreviews).toHaveCount(10);
  
      const firstPageTitles = await articlePreviews
        .locator('h1')
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅在第 2 頁時要求網址反映頁碼，並未主張點選標籤篩選當下網址需帶有 tag 參數。

**為什麼公開材料不支持**（P2 核對器）：公開契約與路由規範中標籤篩選網址為 /tag/:tag（見 routing.md 與 SELECTORS.md），並未規定或測試 hash-based 的 #/?tag= 路由格式。

**關鍵字命中（機械 grep，僅供導航）**

- `RegExp` → `specs/e2e/settings.spec.ts:48` ｜ await expect(page).toHaveURL(new RegExp(`/profile/${user.username}`));
- `RegExp` → `specs/e2e/url-navigation.spec.ts:132` ｜ await expect(page).toHaveURL(new RegExp(`/tag/${uniqueTag}\\?page=2`));


---

## P4-26 · H03 · gpt-5.6-terra · precise

`PR_terra_precise_H03_s2#11` （`generated/PR_terra_precise_H03_s2.spec.ts` 第 68 行）

**需求**

### H03 標籤篩選的分頁
（group: Conduit ▸ 文章列表｜tags: Full,Major）

```
--- steps ---
1. 準備某個標籤底下共 15 篇文章
2. 於首頁以該標籤篩選
3. 點選分頁列的第 2 頁
4. 另開一頁，直接輸入帶 page=2 的網址
5. 切回全部文章的列表
--- expect ---
每頁的文章數符合分頁設定，第二頁是接續的文章；網址會反映目前頁碼；直接輸入網址可以到達同一頁；切回全部文章時回到第一頁。
--- note ---
每頁筆數以產品預設為準。
```

**Gherkin**

```gherkin
@item:H03
    Scenario: Tag-filtered pagination
      Given there are 15 articles under a specific tag
      When the user filters by that tag on the home page
      Then the number of articles per page should match the pagination settings
      When the user selects page 2 from the pagination controls
      Then the articles displayed should be the continuation of the list
      And the URL should reflect the current page number
      When the user directly navigates to the URL with page=2 in a new page
      Then the user should arrive at the same page
      When the user switches back to the all articles list
      Then the list should return to page 1
```

**斷言（▶ 那一行）**

```ts
      await expect(directPage.locator('.article-preview h1')).toHaveText(
        secondPageTitles,
      );
  
      await page.getByRole('link', { name: 'Global Feed', exact: true }).click();
  
▶     await expect(page).toHaveURL(new RegExp('#/$'));
      await expect(articlePreviews).toHaveCount(10);
      await expect(page.getByRole('link', { name: '1', exact: true })).toHaveClass(
        /active/,
      );
  
      await directPage.close();
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅要求切回全部文章時回到第一頁，並未具體規定 URL 必須變為 '#/$'。

**為什麼公開材料不支持**（P2 核對器）：公開契約與官方測試僅約定 URL 為 '/'，完全沒有提及或要求包含 Hash 路由符號 '#/$'。

**關鍵字命中（機械 grep，僅供導航）**

- `RegExp` → `specs/e2e/settings.spec.ts:48` ｜ await expect(page).toHaveURL(new RegExp(`/profile/${user.username}`));
- `RegExp` → `specs/e2e/url-navigation.spec.ts:132` ｜ await expect(page).toHaveURL(new RegExp(`/tag/${uniqueTag}\\?page=2`));


---

## P4-27 · H03 · gpt-5.6-terra · precise

`PR_terra_precise_H03_s2#12` （`generated/PR_terra_precise_H03_s2.spec.ts` 第 69 行）

**需求**

### H03 標籤篩選的分頁
（group: Conduit ▸ 文章列表｜tags: Full,Major）

```
--- steps ---
1. 準備某個標籤底下共 15 篇文章
2. 於首頁以該標籤篩選
3. 點選分頁列的第 2 頁
4. 另開一頁，直接輸入帶 page=2 的網址
5. 切回全部文章的列表
--- expect ---
每頁的文章數符合分頁設定，第二頁是接續的文章；網址會反映目前頁碼；直接輸入網址可以到達同一頁；切回全部文章時回到第一頁。
--- note ---
每頁筆數以產品預設為準。
```

**Gherkin**

```gherkin
@item:H03
    Scenario: Tag-filtered pagination
      Given there are 15 articles under a specific tag
      When the user filters by that tag on the home page
      Then the number of articles per page should match the pagination settings
      When the user selects page 2 from the pagination controls
      Then the articles displayed should be the continuation of the list
      And the URL should reflect the current page number
      When the user directly navigates to the URL with page=2 in a new page
      Then the user should arrive at the same page
      When the user switches back to the all articles list
      Then the list should return to page 1
```

**斷言（▶ 那一行）**

```ts
        secondPageTitles,
      );
  
      await page.getByRole('link', { name: 'Global Feed', exact: true }).click();
  
      await expect(page).toHaveURL(new RegExp('#/$'));
▶     await expect(articlePreviews).toHaveCount(10);
      await expect(page.getByRole('link', { name: '1', exact: true })).toHaveClass(
        /active/,
      );
  
      await directPage.close();
    });
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅要求「切回全部文章時回到第一頁」，未具體約定全部文章列表中第一頁的文章數量為 10 篇。

**為什麼公開材料不支持**（P2 核對器）：公開材料中切換回 Global Feed 時僅驗證網址重設為根路徑及文章載入，並未明確斷言在切回 Global Feed 後文章預覽數量必須恰好為 10 筆。

**關鍵字命中**：無


---

## P4-28 · H03 · gpt-5.6-terra · precise

`PR_terra_precise_H03_s3#2` （`generated/PR_terra_precise_H03_s3.spec.ts` 第 29 行）

**需求**

### H03 標籤篩選的分頁
（group: Conduit ▸ 文章列表｜tags: Full,Major）

```
--- steps ---
1. 準備某個標籤底下共 15 篇文章
2. 於首頁以該標籤篩選
3. 點選分頁列的第 2 頁
4. 另開一頁，直接輸入帶 page=2 的網址
5. 切回全部文章的列表
--- expect ---
每頁的文章數符合分頁設定，第二頁是接續的文章；網址會反映目前頁碼；直接輸入網址可以到達同一頁；切回全部文章時回到第一頁。
--- note ---
每頁筆數以產品預設為準。
```

**Gherkin**

```gherkin
@item:H03
    Scenario: Pagination with tag filter
      Given there are 15 articles under a specific tag
      When a user filters articles by this tag on the home page
      Then the number of displayed articles matches the pagination setting
      When the user selects page 2 from the pagination controls
      Then the second page shows the subsequent articles
      And the URL reflects page 2
      When the user directly opens the URL with page 2
      Then the user arrives at the same page
      When the user switches back to the all articles list
      Then the list returns to the first page
```

**斷言（▶ 那一行）**

```ts
      await expect(tagLink).toBeVisible();
      await tagLink.click();
  
      const articlePreviews = page.locator('.article-preview');
      await expect(articlePreviews).toHaveCount(10);
  
▶     await expect(page).toHaveURL(new RegExp(`#/\\?tag=${encodeURIComponent(tag)}`));
  
      const firstPageTitles = await articlePreviews
        .locator('h1')
        .allTextContents();
  
      await page.getByRole('link', { name: '2', exact: true }).click();
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅要求第 2 頁時網址反映頁碼，並未要求在篩選標籤當下驗證網址帶有 tag 參數。

**為什麼公開材料不支持**（P2 核對器）：公開材料中定義的標籤路由為 `/tag/:tag`，未規定或測試 `/#/?tag=...` 這種 hash-based 路由格式。

**關鍵字命中（機械 grep，僅供導航）**

- `RegExp` → `specs/e2e/settings.spec.ts:48` ｜ await expect(page).toHaveURL(new RegExp(`/profile/${user.username}`));
- `RegExp` → `specs/e2e/url-navigation.spec.ts:132` ｜ await expect(page).toHaveURL(new RegExp(`/tag/${uniqueTag}\\?page=2`));


---

## P4-29 · H03 · gpt-5.6-terra · precise

`PR_terra_precise_H03_s3#11` （`generated/PR_terra_precise_H03_s3.spec.ts` 第 66 行）

**需求**

### H03 標籤篩選的分頁
（group: Conduit ▸ 文章列表｜tags: Full,Major）

```
--- steps ---
1. 準備某個標籤底下共 15 篇文章
2. 於首頁以該標籤篩選
3. 點選分頁列的第 2 頁
4. 另開一頁，直接輸入帶 page=2 的網址
5. 切回全部文章的列表
--- expect ---
每頁的文章數符合分頁設定，第二頁是接續的文章；網址會反映目前頁碼；直接輸入網址可以到達同一頁；切回全部文章時回到第一頁。
--- note ---
每頁筆數以產品預設為準。
```

**Gherkin**

```gherkin
@item:H03
    Scenario: Pagination with tag filter
      Given there are 15 articles under a specific tag
      When a user filters articles by this tag on the home page
      Then the number of displayed articles matches the pagination setting
      When the user selects page 2 from the pagination controls
      Then the second page shows the subsequent articles
      And the URL reflects page 2
      When the user directly opens the URL with page 2
      Then the user arrives at the same page
      When the user switches back to the all articles list
      Then the list returns to the first page
```

**斷言（▶ 那一行）**

```ts
        secondPageTitles,
      );
  
      await page.getByRole('link', { name: 'Global Feed', exact: true }).click();
  
      await expect(articlePreviews).toHaveCount(10);
▶     await expect(page).toHaveURL(new RegExp(`${UI.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/#/$`));
    });
  });
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅要求切回全部文章時「回到第一頁」（列表重設為第一頁），並未要求檢查 URL 是否嚴格為根路徑 /#/$。

**為什麼公開材料不支持**（P2 核對器）：公開材料中定義的首頁路由為 '/'（如 url-navigation.spec.ts 第 228-229 行切換回 Global Feed 時預期 URL 為 '/'），並無任何要求或測試使用包含 Hash 路由 '/#/' 的 URL。

**關鍵字命中（機械 grep，僅供導航）**

- `RegExp` → `specs/e2e/settings.spec.ts:48` ｜ await expect(page).toHaveURL(new RegExp(`/profile/${user.username}`));
- `RegExp` → `specs/e2e/url-navigation.spec.ts:132` ｜ await expect(page).toHaveURL(new RegExp(`/tag/${uniqueTag}\\?page=2`));
- `replace` → `specs/e2e/xss-security.spec.ts:25` ｜ * - Replace a proper security audit / penetration testing


---

## P4-30 · S12 · gpt-5.6-terra · precise

`PR_terra_precise_S12_s1#2` （`generated/PR_terra_precise_S12_s1.spec.ts` 第 31 行）

**需求**

### S12 文章列表換頁
（group: Conduit ▸ 文章列表｜tags: Full）

```
--- steps ---
1. 於首頁的文章列表捲動到分頁列
2. 點選第 2 頁
--- expect ---
顯示的是接續的文章。
```

**Gherkin**

```gherkin
@item:S12
    Scenario: Article list pagination
      Given I scroll to the pagination bar in the article list on the home page
      When I select page 2
      Then the list displays the consecutive articles
```

**斷言（▶ 那一行）**

```ts
      await pagination.scrollIntoViewIfNeeded();
  
      const pageTwo = pagination.getByRole('link', { name: '2', exact: true });
      await expect(pageTwo).toBeVisible();
      await pageTwo.click();
  
▶     await expect(pageTwo).toHaveClass(/active/);
      await expect(articlePreviews).toHaveCount(2);
  
      const secondPageTitles = await articlePreviews.locator('h1').allTextContents();
  
      expect(secondPageTitles).toEqual([
        'Pagination article 2',
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅要求顯示接續文章，未要求分頁按鈕需具備 active 樣式類別。

**為什麼公開材料不支持**（P2 核對器）：契約（SELECTORS.md 及 url-navigation.spec.ts）明確規定 active 樣式類別是套用在分頁項目包裝元素 .page-item 上，而非直接套用在 pageTwo 連結本身。

**關鍵字命中（機械 grep，僅供導航）**

- `active` → `docs/src/content/docs/specifications/frontend/templates.md:42` ｜ > the link of the active page should use the **active** css class.
- `active` → `specs/e2e/SELECTORS.md:213` ｜ - **Pagination active**: The current page's `.page-item` has the CSS class `active`.


---

## P4-31 · S12 · gpt-5.6-terra · precise

`PR_terra_precise_S12_s1#3` （`generated/PR_terra_precise_S12_s1.spec.ts` 第 32 行）

**需求**

### S12 文章列表換頁
（group: Conduit ▸ 文章列表｜tags: Full）

```
--- steps ---
1. 於首頁的文章列表捲動到分頁列
2. 點選第 2 頁
--- expect ---
顯示的是接續的文章。
```

**Gherkin**

```gherkin
@item:S12
    Scenario: Article list pagination
      Given I scroll to the pagination bar in the article list on the home page
      When I select page 2
      Then the list displays the consecutive articles
```

**斷言（▶ 那一行）**

```ts
  
      const pageTwo = pagination.getByRole('link', { name: '2', exact: true });
      await expect(pageTwo).toBeVisible();
      await pageTwo.click();
  
      await expect(pageTwo).toHaveClass(/active/);
▶     await expect(articlePreviews).toHaveCount(2);
  
      const secondPageTitles = await articlePreviews.locator('h1').allTextContents();
  
      expect(secondPageTitles).toEqual([
        'Pagination article 2',
        'Pagination article 1',
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅要求顯示接續的文章，未規定第 2 頁的文章預覽數量必須恰好為 2 篇。

**為什麼公開材料不支持**（P2 核對器）：公開契約中僅有一般分頁機制或特定測試資料集的分頁數量驗證，並未規定或測試點選第 2 頁時文章數量必須恰好為 2 篇。

**關鍵字命中**：無


---

## P4-32 · S12 · gpt-5.6-terra · precise

`PR_terra_precise_S12_s2#2` （`generated/PR_terra_precise_S12_s2.spec.ts` 第 33 行）

**需求**

### S12 文章列表換頁
（group: Conduit ▸ 文章列表｜tags: Full）

```
--- steps ---
1. 於首頁的文章列表捲動到分頁列
2. 點選第 2 頁
--- expect ---
顯示的是接續的文章。
```

**Gherkin**

```gherkin
@item:S12
    Scenario: Article list pagination
      Given a user scrolls to the pagination controls on the home page article list
      When the user selects page 2
      Then the articles displayed should be the continuation of the list
```

**斷言（▶ 那一行）**

```ts
        .locator('h1')
        .allTextContents();
  
      await page.locator('.pagination a', { hasText: '2' }).click();
  
      await expect(page.locator('.pagination .page-item.active')).toHaveText('2');
▶     await expect(articlePreviews).toHaveCount(2);
  
      const secondPageTitles = await articlePreviews
        .locator('h1')
        .allTextContents();
  
      expect(secondPageTitles).not.toEqual(firstPageTitles);
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅要求顯示接續的文章，未規定第 2 頁的文章筆數必須為 2 篇。

**為什麼公開材料不支持**（P2 核對器）：公開契約中僅測試點擊分頁後切換頁面或特定標籤下的文章數量，並未規定或測試首頁點擊第 2 頁時文章預覽的數量必須剛好為 2。

**關鍵字命中**：無


---

## P4-33 · S12 · gpt-5.6-terra · precise

`PR_terra_precise_S12_s3#3` （`generated/PR_terra_precise_S12_s3.spec.ts` 第 31 行）

**需求**

### S12 文章列表換頁
（group: Conduit ▸ 文章列表｜tags: Full）

```
--- steps ---
1. 於首頁的文章列表捲動到分頁列
2. 點選第 2 頁
--- expect ---
顯示的是接續的文章。
```

**Gherkin**

```gherkin
@item:S12
    Scenario: Article list pagination
      Given a user views the article list on the home page and scrolls to the pagination controls
      When the user selects page 2
      Then the subsequent articles are displayed
```

**斷言（▶ 那一行）**

```ts
      await pageTwo.scrollIntoViewIfNeeded();
      await pageTwo.click();
  
      await expect(page).toHaveURL(/[#?&]page=2|offset=10/);
  
      const articlePreviews = page.locator('.article-preview');
▶     await expect(articlePreviews).toHaveCount(2);
      await expect(articlePreviews.first()).toContainText('Pagination article 2');
    });
  });
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅要求顯示接續的文章，未規定接續文章的確切數量為 2 篇。

**為什麼公開材料不支持**（P2 核對器）：公開材料中並無規定或測試點選第 2 頁後首頁文章列表的特定數量必須恰好為 2 篇。

**關鍵字命中**：無


---

## P4-34 · H02 · gpt-5.6-terra · concise

`PR_terra_terse_H02_s1#15` （`generated/PR_terra_terse_H02_s1.spec.ts` 第 72 行）

**需求**

### H02 文章頁的可見性與權限
（group: Conduit ▸ 文章｜tags: Full,Major）

```
--- steps ---
1. 以作者身分建立一篇文章，並在該文章下留一則留言
2. 以未登入的訪客開啟該文章頁
3. 以另一位已登入、非作者的使用者開啟同一頁
4. 該使用者在同一頁留下自己的留言
--- expect ---
不同身分在同一頁看到的東西不一樣，可做的操作也不一樣。
--- note ---
只驗畫面上看得到什麼，不含 API 層的權限。
```

**Gherkin**

```gherkin
@item:H02
    Scenario: Article page visibility and permissions
      Given an author creates an article and leaves a comment under it
      When an unauthenticated visitor opens the article page
      Then what the visitor sees and the actions they can perform should differ based on their role
      When another logged-in user who is not the author opens the same page
      And this user leaves their own comment on the page
      Then what this user sees and the actions they can perform should differ based on their role
```

**斷言（▶ 那一行）**

```ts
  
      const visitorCommentCard = page
        .locator('.card')
        .filter({ hasText: visitorComment });
  
      await expect(visitorCommentCard).toBeVisible();
▶     await expect(visitorCommentCard.getByText(visitor.username, { exact: true })).toBeVisible();
      await expect(
        visitorCommentCard.getByRole('button', { name: /delete comment/i }),
      ).toBeVisible();
  
      const authorCommentCard = page
        .locator('.card')
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅概括提及不同身分所見與操作不同，未明確要求留言卡片上必須顯示使用者名稱。

**為什麼公開材料不支持**（P2 核對器）：公開契約中未明確規範或測試留言卡片內必須顯示留言者的 username 文字。

**關鍵字命中（機械 grep，僅供導航）**

- `username` → `docs/src/content/docs/specifications/backend/api-response-format.md:16` ｜ "username": "jake",
- `username` → `docs/src/content/docs/specifications/backend/endpoints.md:39` ｜ "username": "Jacob",


---

## P4-35 · H02 · gpt-5.6-terra · concise

`PR_terra_terse_H02_s1#16` （`generated/PR_terra_terse_H02_s1.spec.ts` 第 73 行）

**需求**

### H02 文章頁的可見性與權限
（group: Conduit ▸ 文章｜tags: Full,Major）

```
--- steps ---
1. 以作者身分建立一篇文章，並在該文章下留一則留言
2. 以未登入的訪客開啟該文章頁
3. 以另一位已登入、非作者的使用者開啟同一頁
4. 該使用者在同一頁留下自己的留言
--- expect ---
不同身分在同一頁看到的東西不一樣，可做的操作也不一樣。
--- note ---
只驗畫面上看得到什麼，不含 API 層的權限。
```

**Gherkin**

```gherkin
@item:H02
    Scenario: Article page visibility and permissions
      Given an author creates an article and leaves a comment under it
      When an unauthenticated visitor opens the article page
      Then what the visitor sees and the actions they can perform should differ based on their role
      When another logged-in user who is not the author opens the same page
      And this user leaves their own comment on the page
      Then what this user sees and the actions they can perform should differ based on their role
```

**斷言（▶ 那一行）**

```ts
      const visitorCommentCard = page
        .locator('.card')
        .filter({ hasText: visitorComment });
  
      await expect(visitorCommentCard).toBeVisible();
      await expect(visitorCommentCard.getByText(visitor.username, { exact: true })).toBeVisible();
▶     await expect(
        visitorCommentCard.getByRole('button', { name: /delete comment/i }),
      ).toBeVisible();
  
      const authorCommentCard = page
        .locator('.card')
        .filter({ hasText: authorComment });
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅籠統提及不同身分看到與可做的操作不同，未具體提及刪除留言按鈕的存在與可見性，但此為 Conduit 留言作者權限的標準公開行為。

**為什麼公開材料不支持**（P2 核對器）：公開材料中刪除留言按鈕是 .mod-options 下的圖示 (.ion-trash-a)，契約並未規定其為可透過 Accessible Name 'Delete Comment' 定位的 button 元素。

**關鍵字命中（機械 grep，僅供導航）**

- `button` → `docs/src/content/docs/implementation-creation/features.md:7` ｜ - Authenticate users via JWT (login/signup pages + logout button on settings page)
- `button` → `docs/src/content/docs/specifications/frontend/routing.md:15` ｜ - Delete article button (only shown to article's author)
- `delete` → `docs/src/content/docs/specifications/backend/endpoints.md:92` ｜ `DELETE /api/profiles/:username/follow`
- `delete` → `docs/src/content/docs/specifications/frontend/routing.md:15` ｜ - Delete article button (only shown to article's author)
- `comment` → `docs/src/content/docs/implementation-creation/features.md:10` ｜ - CR-D Comments on articles (no updating required)


---

## P4-36 · H02 · gpt-5.6-terra · concise

`PR_terra_terse_H02_s2#4` （`generated/PR_terra_terse_H02_s2.spec.ts` 第 35 行）

**需求**

### H02 文章頁的可見性與權限
（group: Conduit ▸ 文章｜tags: Full,Major）

```
--- steps ---
1. 以作者身分建立一篇文章，並在該文章下留一則留言
2. 以未登入的訪客開啟該文章頁
3. 以另一位已登入、非作者的使用者開啟同一頁
4. 該使用者在同一頁留下自己的留言
--- expect ---
不同身分在同一頁看到的東西不一樣，可做的操作也不一樣。
--- note ---
只驗畫面上看得到什麼，不含 API 層的權限。
```

**Gherkin**

```gherkin
@item:H02
    Scenario: Article page visibility and permissions
      Given a user creates an article and posts a comment under the article as its author
      When a guest who is not logged in opens the article page
      Then the guest should see content and available actions appropriate for an unauthenticated visitor
      When another logged-in user who is not the author opens the same article page
      Then that user should see content and available actions appropriate for a non-author logged-in user
      When that user posts their own comment on the same page
      Then the displayed content and available actions should reflect different roles on the same page
```

**斷言（▶ 那一行）**

```ts
        await page.goto(`${UI}/#/article/${article.slug}`);
  
        await expect(page.getByRole('heading', { name: article.title })).toBeVisible();
        await expect(page.getByText(article.description)).toBeVisible();
        await expect(page.getByText(authorComment)).toBeVisible();
  
▶       await expect(
          page.getByText('Sign in or sign up to add comments on this article.'),
        ).toBeVisible();
  
        await expect(
          page.getByRole('button', { name: /edit article/i }),
        ).toHaveCount(0);
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅抽象提及訪客應看到符合未登入狀態的內容，未具體提及該提示字串，但符合 Conduit 官方規格。

**為什麼公開材料不支持**（P2 核對器）：公開契約與 E2E 測試僅要求未登入時看到 sign in/sign up 連結（a[href='/login']）或不顯示留言表單，並未規定或測試出現 'Sign in or sign up to add comments on this article.' 這段特定文字。

**關鍵字命中（機械 grep，僅供導航）**

- `comments` → `docs/src/content/docs/implementation-creation/features.md:10` ｜ - CR-D Comments on articles (no updating required)
- `comments` → `docs/src/content/docs/specifications/backend/api-response-format.md:125` ｜ ### Multiple Comments
- `article` → `docs/src/content/docs/implementation-creation/features.md:9` ｜ - CRUD Articles
- `article` → `docs/src/content/docs/specifications/backend/api-response-format.md:36` ｜ ### Single Article


---

## P4-37 · H02 · gpt-5.6-terra · concise

`PR_terra_terse_H02_s2#17` （`generated/PR_terra_terse_H02_s2.spec.ts` 第 87 行）

**需求**

### H02 文章頁的可見性與權限
（group: Conduit ▸ 文章｜tags: Full,Major）

```
--- steps ---
1. 以作者身分建立一篇文章，並在該文章下留一則留言
2. 以未登入的訪客開啟該文章頁
3. 以另一位已登入、非作者的使用者開啟同一頁
4. 該使用者在同一頁留下自己的留言
--- expect ---
不同身分在同一頁看到的東西不一樣，可做的操作也不一樣。
--- note ---
只驗畫面上看得到什麼，不含 API 層的權限。
```

**Gherkin**

```gherkin
@item:H02
    Scenario: Article page visibility and permissions
      Given a user creates an article and posts a comment under the article as its author
      When a guest who is not logged in opens the article page
      Then the guest should see content and available actions appropriate for an unauthenticated visitor
      When another logged-in user who is not the author opens the same article page
      Then that user should see content and available actions appropriate for a non-author logged-in user
      When that user posts their own comment on the same page
      Then the displayed content and available actions should reflect different roles on the same page
```

**斷言（▶ 那一行）**

```ts
          .locator('.card')
          .filter({ hasText: otherComment });
  
        await expect(otherCommentCard).toBeVisible();
        await expect(page.getByText(authorComment)).toBeVisible();
  
▶       await expect(
          otherCommentCard.getByRole('button', { name: /delete comment/i }),
        ).toBeVisible();
  
        const authorCommentCard = page
          .locator('.card')
          .filter({ hasText: authorComment });
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅抽象描述不同身分看到和可做的操作不一樣，未明確指出使用者對自己留的留言應可見刪除按鈕。

**為什麼公開材料不支持**（P2 核對器）：公開契約中刪除留言按鈕是透過圖示或特定 class/icon（如 ion-trash-a、.mod-options）定義，沒有任何地方規定或測試其為 Accessible Name 為 'delete comment' 的 button 角色。

**關鍵字命中（機械 grep，僅供導航）**

- `button` → `docs/src/content/docs/implementation-creation/features.md:7` ｜ - Authenticate users via JWT (login/signup pages + logout button on settings page)
- `button` → `docs/src/content/docs/specifications/frontend/routing.md:15` ｜ - Delete article button (only shown to article's author)
- `delete` → `docs/src/content/docs/specifications/backend/endpoints.md:92` ｜ `DELETE /api/profiles/:username/follow`
- `delete` → `docs/src/content/docs/specifications/frontend/routing.md:15` ｜ - Delete article button (only shown to article's author)
- `comment` → `docs/src/content/docs/implementation-creation/features.md:10` ｜ - CR-D Comments on articles (no updating required)


---

## P4-38 · H02 · gpt-5.6-terra · concise

`PR_terra_terse_H02_s3#2` （`generated/PR_terra_terse_H02_s3.spec.ts` 第 28 行）

**需求**

### H02 文章頁的可見性與權限
（group: Conduit ▸ 文章｜tags: Full,Major）

```
--- steps ---
1. 以作者身分建立一篇文章，並在該文章下留一則留言
2. 以未登入的訪客開啟該文章頁
3. 以另一位已登入、非作者的使用者開啟同一頁
4. 該使用者在同一頁留下自己的留言
--- expect ---
不同身分在同一頁看到的東西不一樣，可做的操作也不一樣。
--- note ---
只驗畫面上看得到什麼，不含 API 層的權限。
```

**Gherkin**

```gherkin
@item:H02
    Scenario: Article page visibility and permissions
      Given an author creates an article and leaves a comment on it
      When an unauthenticated visitor opens the article page
      Then what is visible and the available actions differ based on the role
      When another logged-in, non-author user opens the same page
      And this user leaves their own comment on the page
      Then what is visible and the available actions differ based on the role
```

**斷言（▶ 那一行）**

```ts
  
      expect(authorComment.status).toBe(200);
  
      await page.goto(`${UI}/#/article/${article.slug}`);
  
      await expect(page.getByRole('heading', { name: article.title })).toBeVisible();
▶     await expect(page.getByText(article.description)).toBeVisible();
      await expect(
        page.getByText('Comment written by the article author.'),
      ).toBeVisible();
  
      await expect(
        page.getByRole('link', { name: /sign in or sign up to add comments/i }),
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅概括提及「不同身分在同一頁看到的東西不一樣」，未具體要求檢查文章簡介（description）的可見性。

**為什麼公開材料不支持**（P2 核對器）：公開契約的 Article 頁面模板與相關測試中並未規定或測試文章內頁（/article/:slug）需顯示 article.description（僅在列表 preview 與編輯頁出現）。

**關鍵字命中（機械 grep，僅供導航）**

- `article` → `docs/src/content/docs/implementation-creation/features.md:9` ｜ - CRUD Articles
- `article` → `docs/src/content/docs/specifications/backend/api-response-format.md:36` ｜ ### Single Article
- `description` → `docs/src/content/docs/specifications/backend/api-response-format.md:43` ｜ "description": "Ever wonder how?",
- `description` → `docs/src/content/docs/specifications/backend/endpoints.md:152` ｜ "description": "Ever wonder how?",


---

## P4-39 · H02 · gpt-5.6-terra · concise

`PR_terra_terse_H02_s3#4` （`generated/PR_terra_terse_H02_s3.spec.ts` 第 33 行）

**需求**

### H02 文章頁的可見性與權限
（group: Conduit ▸ 文章｜tags: Full,Major）

```
--- steps ---
1. 以作者身分建立一篇文章，並在該文章下留一則留言
2. 以未登入的訪客開啟該文章頁
3. 以另一位已登入、非作者的使用者開啟同一頁
4. 該使用者在同一頁留下自己的留言
--- expect ---
不同身分在同一頁看到的東西不一樣，可做的操作也不一樣。
--- note ---
只驗畫面上看得到什麼，不含 API 層的權限。
```

**Gherkin**

```gherkin
@item:H02
    Scenario: Article page visibility and permissions
      Given an author creates an article and leaves a comment on it
      When an unauthenticated visitor opens the article page
      Then what is visible and the available actions differ based on the role
      When another logged-in, non-author user opens the same page
      And this user leaves their own comment on the page
      Then what is visible and the available actions differ based on the role
```

**斷言（▶ 那一行）**

```ts
      await expect(page.getByRole('heading', { name: article.title })).toBeVisible();
      await expect(page.getByText(article.description)).toBeVisible();
      await expect(
        page.getByText('Comment written by the article author.'),
      ).toBeVisible();
  
▶     await expect(
        page.getByRole('link', { name: /sign in or sign up to add comments/i }),
      ).toBeVisible();
  
      await expect(
        page.getByRole('button', { name: /edit article/i }),
      ).toHaveCount(0);
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅抽象提及『不同身分在同一頁看到的東西不一樣』，未具體提及未登入時會顯示『sign in or sign up to add comments』連結，但符合 RealWorld Conduit 規格。

**為什麼公開材料不支持**（P2 核對器）：公開契約與 E2E 測試中未要求或測試未登入訪客在文章頁需看到包含 'sign in or sign up to add comments' 文字的連結。

**關鍵字命中（機械 grep，僅供導航）**

- `link` → `docs/src/content/docs/specifications/frontend/templates.md:16` ｜ <link
- `link` → `specs/e2e/SELECTORS.md:35` ｜ | `.navbar-brand` | `a`     | Logo / site name link |
- `comments` → `docs/src/content/docs/implementation-creation/features.md:10` ｜ - CR-D Comments on articles (no updating required)
- `comments` → `docs/src/content/docs/specifications/backend/api-response-format.md:125` ｜ ### Multiple Comments


---

## P4-40 · H02 · gpt-5.6-terra · concise

`PR_terra_terse_H02_s3#9` （`generated/PR_terra_terse_H02_s3.spec.ts` 第 49 行）

**需求**

### H02 文章頁的可見性與權限
（group: Conduit ▸ 文章｜tags: Full,Major）

```
--- steps ---
1. 以作者身分建立一篇文章，並在該文章下留一則留言
2. 以未登入的訪客開啟該文章頁
3. 以另一位已登入、非作者的使用者開啟同一頁
4. 該使用者在同一頁留下自己的留言
--- expect ---
不同身分在同一頁看到的東西不一樣，可做的操作也不一樣。
--- note ---
只驗畫面上看得到什麼，不含 API 層的權限。
```

**Gherkin**

```gherkin
@item:H02
    Scenario: Article page visibility and permissions
      Given an author creates an article and leaves a comment on it
      When an unauthenticated visitor opens the article page
      Then what is visible and the available actions differ based on the role
      When another logged-in, non-author user opens the same page
      And this user leaves their own comment on the page
      Then what is visible and the available actions differ based on the role
```

**斷言（▶ 那一行）**

```ts
      await expect(page.getByRole('button', { name: /delete/i })).toHaveCount(0);
  
      await loginAs(page, visitor);
      await page.goto(`${UI}/#/article/${article.slug}`);
  
      await expect(page.getByRole('heading', { name: article.title })).toBeVisible();
▶     await expect(
        page.getByText('Comment written by the article author.'),
      ).toBeVisible();
  
      await expect(
        page.getByPlaceholder(/write a comment/i),
      ).toBeVisible();
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅抽象提及『不同身分看到的東西不一樣』，未具體規範作者留下的留言內容在此角色下應可見。

**為什麼公開材料不支持**（P2 核對器）：公開材料中未規定或測試在切換至另一位登入使用者存取文章頁時，必須看到特定內容為「Comment written by the article author.」的留言文本可見性。

**關鍵字命中（機械 grep，僅供導航）**

- `Comment` → `docs/src/content/docs/implementation-creation/features.md:10` ｜ - CR-D Comments on articles (no updating required)
- `Comment` → `docs/src/content/docs/specifications/backend/api-response-format.md:106` ｜ ### Single Comment
- `article` → `docs/src/content/docs/implementation-creation/features.md:9` ｜ - CRUD Articles
- `article` → `docs/src/content/docs/specifications/backend/api-response-format.md:36` ｜ ### Single Article
- `author` → `docs/src/content/docs/specifications/backend/api-response-format.md:50` ｜ "author": {


---

## P4-41 · H02 · gpt-5.6-terra · concise

`PR_terra_terse_H02_s3#11` （`generated/PR_terra_terse_H02_s3.spec.ts` 第 57 行）

**需求**

### H02 文章頁的可見性與權限
（group: Conduit ▸ 文章｜tags: Full,Major）

```
--- steps ---
1. 以作者身分建立一篇文章，並在該文章下留一則留言
2. 以未登入的訪客開啟該文章頁
3. 以另一位已登入、非作者的使用者開啟同一頁
4. 該使用者在同一頁留下自己的留言
--- expect ---
不同身分在同一頁看到的東西不一樣，可做的操作也不一樣。
--- note ---
只驗畫面上看得到什麼，不含 API 層的權限。
```

**Gherkin**

```gherkin
@item:H02
    Scenario: Article page visibility and permissions
      Given an author creates an article and leaves a comment on it
      When an unauthenticated visitor opens the article page
      Then what is visible and the available actions differ based on the role
      When another logged-in, non-author user opens the same page
      And this user leaves their own comment on the page
      Then what is visible and the available actions differ based on the role
```

**斷言（▶ 那一行）**

```ts
      ).toBeVisible();
  
      await expect(
        page.getByPlaceholder(/write a comment/i),
      ).toBeVisible();
  
▶     await expect(
        page.getByRole('link', { name: /sign in or sign up to add comments/i }),
      ).toHaveCount(0);
  
      await expect(
        page.getByRole('button', { name: /edit article/i }),
      ).toHaveCount(0);
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅抽象提及『不同身分看到的東西不一樣』，未具體規範登入使用者不應看到登入註冊提示連結。

**為什麼公開材料不支持**（P2 核對器）：公開材料中未規定或測試已登入使用者在文章頁時畫面不得出現名為 'sign in or sign up to add comments' 的連結。

**關鍵字命中（機械 grep，僅供導航）**

- `link` → `docs/src/content/docs/specifications/frontend/templates.md:16` ｜ <link
- `link` → `specs/e2e/SELECTORS.md:35` ｜ | `.navbar-brand` | `a`     | Logo / site name link |
- `comments` → `docs/src/content/docs/implementation-creation/features.md:10` ｜ - CR-D Comments on articles (no updating required)
- `comments` → `docs/src/content/docs/specifications/backend/api-response-format.md:125` ｜ ### Multiple Comments


---

## P4-42 · H03 · gpt-5.6-terra · concise

`PR_terra_terse_H03_s1#1` （`generated/PR_terra_terse_H03_s1.spec.ts` 第 30 行）

**需求**

### H03 標籤篩選的分頁
（group: Conduit ▸ 文章列表｜tags: Full,Major）

```
--- steps ---
1. 準備某個標籤底下共 15 篇文章
2. 於首頁以該標籤篩選
3. 點選分頁列的第 2 頁
4. 另開一頁，直接輸入帶 page=2 的網址
5. 切回全部文章的列表
--- expect ---
分頁行為符合設定，換頁後看得到後續的文章，網址跟著變。
--- note ---
每頁筆數以產品預設為準。
```

**Gherkin**

```gherkin
@item:H03
    Scenario: Tag filtering pagination
      Given there are 15 articles under a specific tag
      When the user filters by that tag on the home page
      And the user clicks page 2 in the pagination bar
      Then the pagination behavior should match the configuration, showing subsequent articles and updating the URL
      When the user opens a new page and directly enters the URL with page=2
      Then the pagination behavior should match the configuration, showing subsequent articles
      When the user switches back to the all articles list
      Then the pagination behavior should match the configuration
```

**斷言（▶ 那一行）**

```ts
    await page.goto(`${UI}/#/`);
  
    const tagLink = page.getByRole('link', { name: tag, exact: true });
    await expect(tagLink).toBeVisible();
    await tagLink.click();
  
▶   await expect(page).toHaveURL(new RegExp(`#/?\\?tag=${tag}`));
  
    const articlePreviews = page.locator('.article-preview');
    await expect(articlePreviews).toHaveCount(10);
    await expect(articlePreviews.first()).toContainText('Pagination article 15');
  
    const page2 = page.getByRole('link', { name: '2', exact: true });
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅在分頁點選後要求網址跟著變，未要求以標籤篩選當下 URL 必須立即帶有 tag 查詢參數。

**為什麼公開材料不支持**（P2 核對器）：公開契約中規範與測試的標籤路由為 '/tag/:tag'（如 SELECTORS.md 行 148 與 url-navigation.spec.ts），未要求或測試 '#/?tag=' 這種 Hash 路由形式。

**關鍵字命中（機械 grep，僅供導航）**

- `RegExp` → `specs/e2e/settings.spec.ts:48` ｜ await expect(page).toHaveURL(new RegExp(`/profile/${user.username}`));
- `RegExp` → `specs/e2e/url-navigation.spec.ts:132` ｜ await expect(page).toHaveURL(new RegExp(`/tag/${uniqueTag}\\?page=2`));


---

## P4-43 · H03 · gpt-5.6-terra · concise

`PR_terra_terse_H03_s1#3` （`generated/PR_terra_terse_H03_s1.spec.ts` 第 34 行）

**需求**

### H03 標籤篩選的分頁
（group: Conduit ▸ 文章列表｜tags: Full,Major）

```
--- steps ---
1. 準備某個標籤底下共 15 篇文章
2. 於首頁以該標籤篩選
3. 點選分頁列的第 2 頁
4. 另開一頁，直接輸入帶 page=2 的網址
5. 切回全部文章的列表
--- expect ---
分頁行為符合設定，換頁後看得到後續的文章，網址跟著變。
--- note ---
每頁筆數以產品預設為準。
```

**Gherkin**

```gherkin
@item:H03
    Scenario: Tag filtering pagination
      Given there are 15 articles under a specific tag
      When the user filters by that tag on the home page
      And the user clicks page 2 in the pagination bar
      Then the pagination behavior should match the configuration, showing subsequent articles and updating the URL
      When the user opens a new page and directly enters the URL with page=2
      Then the pagination behavior should match the configuration, showing subsequent articles
      When the user switches back to the all articles list
      Then the pagination behavior should match the configuration
```

**斷言（▶ 那一行）**

```ts
    await tagLink.click();
  
    await expect(page).toHaveURL(new RegExp(`#/?\\?tag=${tag}`));
  
    const articlePreviews = page.locator('.article-preview');
    await expect(articlePreviews).toHaveCount(10);
▶   await expect(articlePreviews.first()).toContainText('Pagination article 15');
  
    const page2 = page.getByRole('link', { name: '2', exact: true });
    await expect(page2).toBeVisible();
    await page2.click();
  
    await expect(page).toHaveURL(
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅要求換頁後看得到後續文章，未具體規範第一頁第一篇文章的標題名稱為 Pagination article 15。

**為什麼公開材料不支持**（P2 核對器）：公開契約與 E2E 測試中僅驗證標籤篩選分頁的數量與分頁 URL 變化，並未規範或斷言第一筆文章預覽必須包含特定文字 'Pagination article 15'。

**關鍵字命中（機械 grep，僅供導航）**

- `Pagination` → `docs/src/content/docs/specifications/frontend/routing.md:8` ｜ - Pagination for list of articles
- `Pagination` → `docs/src/content/docs/specifications/frontend/templates.md:191` ｜ <ul class="pagination">
- `article` → `docs/src/content/docs/implementation-creation/features.md:9` ｜ - CRUD Articles
- `article` → `docs/src/content/docs/specifications/backend/api-response-format.md:36` ｜ ### Single Article


---

## P4-44 · H03 · gpt-5.6-terra · concise

`PR_terra_terse_H03_s1#11` （`generated/PR_terra_terse_H03_s1.spec.ts` 第 60 行）

**需求**

### H03 標籤篩選的分頁
（group: Conduit ▸ 文章列表｜tags: Full,Major）

```
--- steps ---
1. 準備某個標籤底下共 15 篇文章
2. 於首頁以該標籤篩選
3. 點選分頁列的第 2 頁
4. 另開一頁，直接輸入帶 page=2 的網址
5. 切回全部文章的列表
--- expect ---
分頁行為符合設定，換頁後看得到後續的文章，網址跟著變。
--- note ---
每頁筆數以產品預設為準。
```

**Gherkin**

```gherkin
@item:H03
    Scenario: Tag filtering pagination
      Given there are 15 articles under a specific tag
      When the user filters by that tag on the home page
      And the user clicks page 2 in the pagination bar
      Then the pagination behavior should match the configuration, showing subsequent articles and updating the URL
      When the user opens a new page and directly enters the URL with page=2
      Then the pagination behavior should match the configuration, showing subsequent articles
      When the user switches back to the all articles list
      Then the pagination behavior should match the configuration
```

**斷言（▶ 那一行）**

```ts
    );
  
    const globalFeed = page.getByRole('link', { name: 'Global Feed', exact: true });
    await expect(globalFeed).toBeVisible();
    await globalFeed.click();
  
▶   await expect(page).toHaveURL(/#\/?$/);
    await expect(articlePreviews).toHaveCount(10);
    await expect(page.getByRole('link', { name: '2', exact: true })).toBeVisible();
  
    await directPage.close();
  });
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅在第 3 步點選分頁時提到網址跟著變，但在第 5 步切回全部文章列表時並未規範網址應變回首頁/#/。

**為什麼公開材料不支持**（P2 核對器）：公開契約與 E2E 測試皆規範切換至 Global Feed 時 URL 應為 '/'，並未要求或測試以 Hash 路由形式（/#/?$）呈現。

**關鍵字命中**：無


---

## P4-45 · H03 · gpt-5.6-terra · concise

`PR_terra_terse_H03_s1#12` （`generated/PR_terra_terse_H03_s1.spec.ts` 第 61 行）

**需求**

### H03 標籤篩選的分頁
（group: Conduit ▸ 文章列表｜tags: Full,Major）

```
--- steps ---
1. 準備某個標籤底下共 15 篇文章
2. 於首頁以該標籤篩選
3. 點選分頁列的第 2 頁
4. 另開一頁，直接輸入帶 page=2 的網址
5. 切回全部文章的列表
--- expect ---
分頁行為符合設定，換頁後看得到後續的文章，網址跟著變。
--- note ---
每頁筆數以產品預設為準。
```

**Gherkin**

```gherkin
@item:H03
    Scenario: Tag filtering pagination
      Given there are 15 articles under a specific tag
      When the user filters by that tag on the home page
      And the user clicks page 2 in the pagination bar
      Then the pagination behavior should match the configuration, showing subsequent articles and updating the URL
      When the user opens a new page and directly enters the URL with page=2
      Then the pagination behavior should match the configuration, showing subsequent articles
      When the user switches back to the all articles list
      Then the pagination behavior should match the configuration
```

**斷言（▶ 那一行）**

```ts
  
    const globalFeed = page.getByRole('link', { name: 'Global Feed', exact: true });
    await expect(globalFeed).toBeVisible();
    await globalFeed.click();
  
    await expect(page).toHaveURL(/#\/?$/);
▶   await expect(articlePreviews).toHaveCount(10);
    await expect(page.getByRole('link', { name: '2', exact: true })).toBeVisible();
  
    await directPage.close();
  });
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求只寫『每頁筆數以產品預設為準』但未明定每頁應有10篇，兩處文本皆未支持數量剛好為10篇的斷言，需依賴 Conduit 預設規格 (P2)。

**為什麼公開材料不支持**（P2 核對器）：公開契約與測試中未規定或斷言切回 Global Feed 後文章預覽數量必須恰好為 10 筆。

**關鍵字命中**：無


---

## P4-46 · H03 · gpt-5.6-terra · concise

`PR_terra_terse_H03_s2#1` （`generated/PR_terra_terse_H03_s2.spec.ts` 第 27 行）

**需求**

### H03 標籤篩選的分頁
（group: Conduit ▸ 文章列表｜tags: Full,Major）

```
--- steps ---
1. 準備某個標籤底下共 15 篇文章
2. 於首頁以該標籤篩選
3. 點選分頁列的第 2 頁
4. 另開一頁，直接輸入帶 page=2 的網址
5. 切回全部文章的列表
--- expect ---
分頁行為符合設定，換頁後看得到後續的文章，網址跟著變。
--- note ---
每頁筆數以產品預設為準。
```

**Gherkin**

```gherkin
@item:H03
    Scenario: Tag filter pagination
      Given there are 15 articles under a specific tag
      When the user filters by that tag on the home page
      And selects page 2 from the pagination bar
      Then subsequent articles should be visible
      And the URL should reflect the change
      When the user opens a new page and navigates directly to the URL with page=2
      Then subsequent articles should be visible
      When the user switches back to the all articles list
      Then the pagination behavior should meet expectations
```

**斷言（▶ 那一行）**

```ts
  
      await page.goto(`${UI}/#/`);
      await expect(page.getByText(tag, { exact: true })).toBeVisible();
  
      await page.getByText(tag, { exact: true }).click();
  
▶     await expect(page).toHaveURL(new RegExp(`#/?\\?tag=${encodeURIComponent(tag)}|#/?tag=${encodeURIComponent(tag)}`));
      await expect(page.getByRole('link', { name: '2', exact: true })).toBeVisible();
  
      await page.getByRole('link', { name: '2', exact: true }).click();
  
      await expect(page).toHaveURL(
        new RegExp(`tag=${encodeURIComponent(tag)}.*page=2|page=2.*tag=${encodeURIComponent(tag)}`),
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅在分頁換頁後主張網址跟著變，未要求以標籤篩選時網址必須包含 tag 參數。

**為什麼公開材料不支持**（P2 核對器）：公開契約中規範的標籤篩選路由為 `/tag/:tag`，並未提及或測試 hash routing (`#/?tag=` 或 `#/?\?tag=`) 的 URL 格式。

**關鍵字命中（機械 grep，僅供導航）**

- `RegExp` → `specs/e2e/settings.spec.ts:48` ｜ await expect(page).toHaveURL(new RegExp(`/profile/${user.username}`));
- `RegExp` → `specs/e2e/url-navigation.spec.ts:132` ｜ await expect(page).toHaveURL(new RegExp(`/tag/${uniqueTag}\\?page=2`));


---

## P4-47 · H03 · gpt-5.6-terra · concise

`PR_terra_terse_H03_s3#1` （`generated/PR_terra_terse_H03_s3.spec.ts` 第 26 行）

**需求**

### H03 標籤篩選的分頁
（group: Conduit ▸ 文章列表｜tags: Full,Major）

```
--- steps ---
1. 準備某個標籤底下共 15 篇文章
2. 於首頁以該標籤篩選
3. 點選分頁列的第 2 頁
4. 另開一頁，直接輸入帶 page=2 的網址
5. 切回全部文章的列表
--- expect ---
分頁行為符合設定，換頁後看得到後續的文章，網址跟著變。
--- note ---
每頁筆數以產品預設為準。
```

**Gherkin**

```gherkin
@item:H03
    Scenario: Pagination for tag filtering
      Given there are 15 articles under a specific tag
      When the user filters by that tag on the home page
      And the user clicks page 2 in the pagination bar
      Then the pagination behavior matches the settings, subsequent articles are visible, and the URL changes accordingly
      When the user opens another page and directly enters the URL with page=2
      Then the pagination behavior matches the settings, subsequent articles are visible, and the URL changes accordingly
      When the user switches back to the all articles list
      Then the pagination behavior matches the settings, subsequent articles are visible, and the URL changes accordingly
```

**斷言（▶ 那一行）**

```ts
      await loginAs(page, user);
  
      await page.goto(`${UI}/#/`);
      await expect(page).toHaveURL(/#\/$/);
  
      await page.getByRole('link', { name: tag, exact: true }).click();
▶     await expect(page).toHaveURL(new RegExp(`#/\\?tag=${encodeURIComponent(tag)}`));
  
      await expect(page.getByText(articles[0].title)).toBeVisible();
      await expect(page.getByText(articles[9].title)).toBeVisible();
      await expect(page.getByText(articles[10].title)).not.toBeVisible();
  
      const pageTwo = page.getByRole('link', { name: '2', exact: true });
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅要求分頁換頁後網址跟著變，未要求以標籤篩選當下的特定 URL query 結構。

**為什麼公開材料不支持**（P2 核對器）：官方契約規範之標籤路由為 `/tag/:tag`（如 specs/e2e/SELECTORS.md 第 148 行與 url-navigation.spec.ts 第 39-50 行），未規範亦未測試以 hash 查詢參數 `#/\?tag=...` 呈現標籤篩選的 URL 行為。

**關鍵字命中（機械 grep，僅供導航）**

- `RegExp` → `specs/e2e/settings.spec.ts:48` ｜ await expect(page).toHaveURL(new RegExp(`/profile/${user.username}`));
- `RegExp` → `specs/e2e/url-navigation.spec.ts:132` ｜ await expect(page).toHaveURL(new RegExp(`/tag/${uniqueTag}\\?page=2`));


---

## P4-48 · H03 · gpt-5.6-terra · concise

`PR_terra_terse_H03_s3#17` （`generated/PR_terra_terse_H03_s3.spec.ts` 第 57 行）

**需求**

### H03 標籤篩選的分頁
（group: Conduit ▸ 文章列表｜tags: Full,Major）

```
--- steps ---
1. 準備某個標籤底下共 15 篇文章
2. 於首頁以該標籤篩選
3. 點選分頁列的第 2 頁
4. 另開一頁，直接輸入帶 page=2 的網址
5. 切回全部文章的列表
--- expect ---
分頁行為符合設定，換頁後看得到後續的文章，網址跟著變。
--- note ---
每頁筆數以產品預設為準。
```

**Gherkin**

```gherkin
@item:H03
    Scenario: Pagination for tag filtering
      Given there are 15 articles under a specific tag
      When the user filters by that tag on the home page
      And the user clicks page 2 in the pagination bar
      Then the pagination behavior matches the settings, subsequent articles are visible, and the URL changes accordingly
      When the user opens another page and directly enters the URL with page=2
      Then the pagination behavior matches the settings, subsequent articles are visible, and the URL changes accordingly
      When the user switches back to the all articles list
      Then the pagination behavior matches the settings, subsequent articles are visible, and the URL changes accordingly
```

**斷言（▶ 那一行）**

```ts
      await expect(page.getByText(articles[14].title)).toBeVisible();
      await expect(page.getByText(articles[0].title)).not.toBeVisible();
  
      await page.getByRole('link', { name: 'Global Feed', exact: true }).click();
      await expect(page).toHaveURL(/#\/$/);
      await expect(page.getByText(articles[0].title)).toBeVisible();
▶     await expect(page.getByText(articles[10].title)).toBeVisible();
    });
  });
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅要求切回全部文章後分頁符合設定，未具體規範切回全域列表（預設每頁 10 筆）時第 11 篇（index 10）文章是否應同時可見。

**為什麼公開材料不支持**（P2 核對器）：公開材料中並未規定切回 Global Feed 後第 11 篇（index 10）特定文章必須可見（預設每頁筆數可能為 10 或 20，且文章排序亦未保證特定順序可見）。

**關鍵字命中（機械 grep，僅供導航）**

- `articles` → `docs/src/content/docs/implementation-creation/features.md:9` ｜ - CRUD Articles
- `articles` → `docs/src/content/docs/specifications/backend/api-response-format.md:60` ｜ ### Multiple Articles
- `title` → `docs/src/content/docs/implementation-creation/expectations.md:2` ｜ title: Expectations
- `title` → `docs/src/content/docs/implementation-creation/features.md:2` ｜ title: Features


---

## P4-49 · S03 · gpt-5.6-terra · concise

`PR_terra_terse_S03_s1#2` （`generated/PR_terra_terse_S03_s1.spec.ts` 第 16 行）

**需求**

### S03 密碼錯誤的登入
（group: Conduit ▸ 帳號｜tags: Full）

```
--- steps ---
1. 於登入頁輸入已註冊的 email 與錯誤的密碼
2. 送出
--- expect ---
登入不會成功，畫面會告知。
```

**Gherkin**

```gherkin
@item:S03
    Scenario: Login with incorrect password
      Given a user enters a registered email and an incorrect password on the login page
      When the user submits the form
      Then the login should not succeed and the page should inform the user
```

**斷言（▶ 那一行）**

```ts
      await page.getByPlaceholder('Email').fill(user.email);
      await page.getByPlaceholder('Password').fill('incorrect-password');
      await page.getByRole('button', { name: /sign in/i }).click();
  
      await expect(page).toHaveURL(/#\/login/);
      await expect(page.locator('.error-messages')).toBeVisible();
▶     await expect(page.locator('.error-messages')).toContainText(/email or password is invalid/i);
    });
  });
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅要求「畫面會告知」，未具體規定錯誤訊息文字為 email or password is invalid，屬於 RealWorld API/Conduit 規範細節。

**為什麼公開材料不支持**（P2 核對器）：公開契約的 E2E 測試僅驗證 .error-messages 可見，API 規格僅定義錯誤格式與狀態碼，未規範前端畫面必須包含特定字串 'email or password is invalid'。

**關鍵字命中（機械 grep，僅供導航）**

- `.error-messages` → `specs/e2e/SELECTORS.md:103` ｜ | `.error-messages` | `ul`    | Validation / API error list |
- `.error-messages` → `specs/e2e/auth.spec.ts:39` ｜ await expect(page.locator('.error-messages')).toBeVisible();
- `error-messages` → `docs/src/content/docs/specifications/frontend/templates.md:236` ｜ <ul class="error-messages">
- `error-messages` → `specs/e2e/SELECTORS.md:103` ｜ | `.error-messages` | `ul`    | Validation / API error list |
- `email` → `docs/src/content/docs/specifications/backend/api-response-format.md:14` ｜ "email": "jake@jake.jake",


---

## P4-50 · S03 · gpt-5.6-terra · concise

`PR_terra_terse_S03_s2#2` （`generated/PR_terra_terse_S03_s2.spec.ts` 第 16 行）

**需求**

### S03 密碼錯誤的登入
（group: Conduit ▸ 帳號｜tags: Full）

```
--- steps ---
1. 於登入頁輸入已註冊的 email 與錯誤的密碼
2. 送出
--- expect ---
登入不會成功，畫面會告知。
```

**Gherkin**

```gherkin
@item:S03
    Scenario: Login with incorrect password
      Given the user is on the login page
      When the user enters a registered email and an incorrect password and submits
      Then login should not succeed
      And the screen should notify the user
```

**斷言（▶ 那一行）**

```ts
      await page.getByPlaceholder('Email').fill(user.email);
      await page.getByPlaceholder('Password').fill('incorrect-password');
      await page.getByRole('button', { name: /sign in/i }).click();
  
      await expect(page).toHaveURL(/#\/login$/);
      await expect(page.locator('.error-messages')).toBeVisible();
▶     await expect(page.locator('.error-messages')).toContainText(/email or password is invalid/i);
    });
  });
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅要求「畫面會告知」，未具體規定錯誤訊息文字為 email or password is invalid，但可由 RealWorld 規範推出。

**為什麼公開材料不支持**（P2 核對器）：公開材料中 specs/e2e/auth.spec.ts 僅斷言 .error-messages 可見，API 錯誤規範為 credentials invalid，並未要求頁面錯誤訊息必須包含 'email or password is invalid' 文字。

**關鍵字命中（機械 grep，僅供導航）**

- `.error-messages` → `specs/e2e/SELECTORS.md:103` ｜ | `.error-messages` | `ul`    | Validation / API error list |
- `.error-messages` → `specs/e2e/auth.spec.ts:39` ｜ await expect(page.locator('.error-messages')).toBeVisible();
- `error-messages` → `docs/src/content/docs/specifications/frontend/templates.md:236` ｜ <ul class="error-messages">
- `error-messages` → `specs/e2e/SELECTORS.md:103` ｜ | `.error-messages` | `ul`    | Validation / API error list |
- `email` → `docs/src/content/docs/specifications/backend/api-response-format.md:14` ｜ "email": "jake@jake.jake",


---

## P4-51 · S09 · gpt-5.6-terra · concise

`PR_terra_terse_S09_s2#7` （`generated/PR_terra_terse_S09_s2.spec.ts` 第 50 行）

**需求**

### S09 留言刪除的可見性
（group: Conduit ▸ 留言｜tags: Full）

```
--- steps ---
1. 以使用者 A 在某篇文章留言
2. 以使用者 B 開啟同一篇文章並留下自己的留言
--- expect ---
留言的刪除只有自己的留言做得到。
```

**Gherkin**

```gherkin
@item:S09
    Scenario: Visibility of comment deletion
      Given user A posts a comment on an article
      When user B opens the same article and posts their own comment
      Then deleting a comment should only be possible for one's own comment
```

**斷言（▶ 那一行）**

```ts
    await expect(userAComment.getByRole('button')).toHaveCount(0);
    await expect(userBComment.getByRole('button')).toHaveCount(1);
  
    await userBComment.getByRole('button').click();
  
    await expect(page.getByText('Comment written by user B')).toHaveCount(0);
▶   await expect(page.getByText('Comment written by user A')).toBeVisible();
  });
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅規範「留言的刪除只有自己的留言做得到」，並未要求驗證刪除使用者 B 的留言後使用者 A 的留言仍可見。

**為什麼公開材料不支持**（P2 核對器）：公開契約中僅有 API 層級驗證刪除一則留言後另一則保留（specs/api/hurl/comments.hurl），未在前端 E2E 測試或規格中定義或測試使用者刪除自己的留言後其他人的留言仍維持可見的可觀測行為。

**關鍵字命中（機械 grep，僅供導航）**

- `Comment` → `docs/src/content/docs/implementation-creation/features.md:10` ｜ - CR-D Comments on articles (no updating required)
- `Comment` → `docs/src/content/docs/specifications/backend/api-response-format.md:106` ｜ ### Single Comment


---

## P4-52 · S12 · gpt-5.6-terra · concise

`PR_terra_terse_S12_s1#2` （`generated/PR_terra_terse_S12_s1.spec.ts` 第 35 行）

**需求**

### S12 文章列表換頁
（group: Conduit ▸ 文章列表｜tags: Full）

```
--- steps ---
1. 於首頁的文章列表捲動到分頁列
2. 點選第 2 頁
--- expect ---
換頁後看到的是不一樣的文章。
```

**Gherkin**

```gherkin
@item:S12
    Scenario: Article list pagination
      Given the user scrolls to the pagination bar on the home page article list
      When the user clicks page 2
      Then the user should see different articles after changing the page
```

**斷言（▶ 那一行）**

```ts
      await pagination.scrollIntoViewIfNeeded();
  
      const pageTwo = pagination.getByRole('link', { name: '2', exact: true });
      await expect(pageTwo).toBeVisible();
      await pageTwo.click();
  
▶     await expect(page).toHaveURL(/#\/\?page=2/);
      await expect(articlePreviews).toHaveCount(1);
  
      const secondPageTitles = await articlePreviews
        .locator('h1')
        .allTextContents();
  
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅要求換頁後看到不同的文章，並未規定 URL 路由或 query string 的變化形式。

**為什麼公開材料不支持**（P2 核對器）：公開材料中規範的分頁路由格式為 /?page=N（如 specs/e2e/SELECTORS.md 第 147 行及 specs/e2e/url-navigation.spec.ts），並未規範或提及使用 Hash 路由的 /#/?page=2。

**關鍵字命中（機械 grep，僅供導航）**

- `?page=2` → `specs/e2e/url-navigation.spec.ts:131` ｜ // URL should have ?page=2


---

## P4-53 · S12 · gpt-5.6-terra · concise

`PR_terra_terse_S12_s1#3` （`generated/PR_terra_terse_S12_s1.spec.ts` 第 36 行）

**需求**

### S12 文章列表換頁
（group: Conduit ▸ 文章列表｜tags: Full）

```
--- steps ---
1. 於首頁的文章列表捲動到分頁列
2. 點選第 2 頁
--- expect ---
換頁後看到的是不一樣的文章。
```

**Gherkin**

```gherkin
@item:S12
    Scenario: Article list pagination
      Given the user scrolls to the pagination bar on the home page article list
      When the user clicks page 2
      Then the user should see different articles after changing the page
```

**斷言（▶ 那一行）**

```ts
  
      const pageTwo = pagination.getByRole('link', { name: '2', exact: true });
      await expect(pageTwo).toBeVisible();
      await pageTwo.click();
  
      await expect(page).toHaveURL(/#\/\?page=2/);
▶     await expect(articlePreviews).toHaveCount(1);
  
      const secondPageTitles = await articlePreviews
        .locator('h1')
        .allTextContents();
  
      expect(secondPageTitles).not.toEqual(firstPageTitles);
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅要求換頁後看到不一樣的文章，並未規範第 2 頁的文章預覽數量必須為 1 篇。

**為什麼公開材料不支持**（P2 核對器）：公開材料中未規定點選第 2 頁時文章列表預覽數量必須恰好為 1。

**關鍵字命中**：無


---

## P4-54 · S12 · gpt-5.6-terra · concise

`PR_terra_terse_S12_s3#2` （`generated/PR_terra_terse_S12_s3.spec.ts` 第 32 行）

**需求**

### S12 文章列表換頁
（group: Conduit ▸ 文章列表｜tags: Full）

```
--- steps ---
1. 於首頁的文章列表捲動到分頁列
2. 點選第 2 頁
--- expect ---
換頁後看到的是不一樣的文章。
```

**Gherkin**

```gherkin
@item:S12
    Scenario: Article list pagination
      Given the user is on the article list on the home page
      When the user scrolls to the pagination bar and clicks page 2
      Then different articles are displayed after changing the page
```

**斷言（▶ 那一行）**

```ts
      const pageTwo = page.locator('.pagination a', { hasText: '2' });
      await expect(pageTwo).toBeVisible();
  
      await pageTwo.scrollIntoViewIfNeeded();
      await pageTwo.click();
  
▶     await expect(page).toHaveURL(/[#/]\/?\?offset=10/);
      await expect(articlePreviews).toHaveCount(2);
  
      const secondPageTitles = await articlePreviews.locator('h1').allTextContents();
      expect(secondPageTitles).not.toEqual(firstPageTitles);
    });
  });
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅主張換頁後看到不一樣的文章，未提及網址需帶有特定 query 參數（offset=10）。

**為什麼公開材料不支持**（P2 核對器）：公開規格與測試中分頁的 URL 參數規定為 ?page=N，從未要求使用 ?offset=10 作為前端網址參數。

**關鍵字命中（機械 grep，僅供導航）**

- `offset` → `docs/src/content/docs/specifications/backend/endpoints.md:122` ｜ Offset/skip number of articles (default is 0):
- `offset` → `docs/src/content/docs/specifications/frontend/templates.md:230` ｜ <div class="col-md-6 offset-md-3 col-xs-12">


---

## P4-55 · S12 · gpt-5.6-terra · concise

`PR_terra_terse_S12_s3#3` （`generated/PR_terra_terse_S12_s3.spec.ts` 第 33 行）

**需求**

### S12 文章列表換頁
（group: Conduit ▸ 文章列表｜tags: Full）

```
--- steps ---
1. 於首頁的文章列表捲動到分頁列
2. 點選第 2 頁
--- expect ---
換頁後看到的是不一樣的文章。
```

**Gherkin**

```gherkin
@item:S12
    Scenario: Article list pagination
      Given the user is on the article list on the home page
      When the user scrolls to the pagination bar and clicks page 2
      Then different articles are displayed after changing the page
```

**斷言（▶ 那一行）**

```ts
      await expect(pageTwo).toBeVisible();
  
      await pageTwo.scrollIntoViewIfNeeded();
      await pageTwo.click();
  
      await expect(page).toHaveURL(/[#/]\/?\?offset=10/);
▶     await expect(articlePreviews).toHaveCount(2);
  
      const secondPageTitles = await articlePreviews.locator('h1').allTextContents();
      expect(secondPageTitles).not.toEqual(firstPageTitles);
    });
  });
```

**為什麼需求／Gherkin 不支持**（主判定器）：驗收要求與 Gherkin 僅要求換頁後看到不一樣的文章，未規範第二頁文章的具體數量必須為 2 篇。

**為什麼公開材料不支持**（P2 核對器）：公開材料中未規定首頁分頁後第二頁必須恰好顯示 2 篇文章（僅在特定自定義標籤測試中有 5 篇或 API Hurl 範例中的不同筆數，但無首頁第二頁 count 為 2 的要求）。

**關鍵字命中**：無


---

## 附錄：公開材料清單

- `docs/src/content/docs/implementation-creation/expectations.md`（35 行）
- `docs/src/content/docs/implementation-creation/features.md`（13 行）
- `docs/src/content/docs/specifications/backend/api-response-format.md`（153 行）
- `docs/src/content/docs/specifications/backend/endpoints.md`（243 行）
- `docs/src/content/docs/specifications/backend/error-handling.md`（25 行）
- `docs/src/content/docs/specifications/backend/introduction.md`（13 行）
- `docs/src/content/docs/specifications/frontend/api.md`（34 行）
- `docs/src/content/docs/specifications/frontend/routing.md`（21 行）
- `docs/src/content/docs/specifications/frontend/styles.md`（18 行）
- `docs/src/content/docs/specifications/frontend/templates.md`（608 行）
- `specs/api/hurl/articles.hurl`（256 行）
- `specs/api/hurl/auth.hurl`（246 行）
- `specs/api/hurl/comments.hurl`（124 行）
- `specs/api/hurl/errors_articles.hurl`（191 行）
- `specs/api/hurl/errors_auth.hurl`（224 行）
- `specs/api/hurl/errors_authorization.hurl`（89 行）
- `specs/api/hurl/errors_comments.hurl`（91 行）
- `specs/api/hurl/errors_profiles.hurl`（44 行）
- `specs/api/hurl/favorites.hurl`（132 行）
- `specs/api/hurl/feed.hurl`（129 行）
- `specs/api/hurl/pagination.hurl`（68 行）
- `specs/api/hurl/profiles.hurl`（72 行）
- `specs/api/hurl/tags.hurl`（43 行）
- `specs/api/openapi.yml`（922 行）
- `specs/e2e/SELECTORS.md`（213 行）
- `specs/e2e/articles.spec.ts`（306 行）
- `specs/e2e/auth.spec.ts`（105 行）
- `specs/e2e/comments.spec.ts`（163 行）
- `specs/e2e/error-handling.spec.ts`（911 行）
- `specs/e2e/navigation.spec.ts`（251 行）
- `specs/e2e/null-fields.spec.ts`（180 行）
- `specs/e2e/settings.spec.ts`（271 行）
- `specs/e2e/social.spec.ts`（187 行）
- `specs/e2e/url-navigation.spec.ts`（270 行）
- `specs/e2e/user-fetch-errors.spec.ts`（309 行）
- `specs/e2e/xss-security.spec.ts`（293 行）
