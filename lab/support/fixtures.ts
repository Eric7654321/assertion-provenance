// 測試共用 fixture：所有條件（含受測 agent 產出的測試）都用同一份，
// 這樣量到的差別才是斷言品質，不是誰比較會寫登入樣板。
import { Page } from '@playwright/test';

export const API = 'http://127.0.0.1:3001/api';
export const UI = 'http://127.0.0.1:3002';

const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString().slice(-5);

export type User = { username: string; email: string; password: string; token: string };

async function api(path: string, method: string, body?: unknown, token?: string) {
  const res = await fetch(API + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: any = {};
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  return { status: res.status, json };
}

export async function newUser(): Promise<User> {
  const name = 'u' + uid();
  const email = `${name}@example.com`;
  const password = 'probe12345';
  const r = await api('/users', 'POST', { user: { username: name, email, password } });
  return { username: name, email, password, token: r.json?.user?.token };
}

export async function newArticle(u: User, over: Partial<{ title: string; description: string; body: string; tagList: string[] }> = {}) {
  const title = over.title ?? 'Art ' + uid();
  const r = await api('/articles', 'POST', {
    article: {
      title,
      description: over.description ?? 'desc',
      body: over.body ?? 'body text',
      tagList: over.tagList ?? ['alpha'],
    },
  }, u.token);
  return r.json?.article;
}

export const apiCall = api;

/** 把登入狀態直接塞進 localStorage，省掉每個測試都走一次登入表單。 */
export async function loginAs(page: Page, u: User) {
  await page.goto(UI + '/#/');
  // 形狀要跟 services/userLogin.js 存的一致：{ headers, isAuth, loggedUser }
  await page.evaluate((state) => {
    localStorage.setItem('loggedUser', JSON.stringify(state));
  }, {
    headers: { Authorization: `Token ${u.token}` },
    isAuth: true,
    loggedUser: { username: u.username, email: u.email, token: u.token, bio: null, image: null },
  });
  await page.reload();
}
