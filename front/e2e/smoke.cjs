// End-to-end smoke run against a real backend (H2) and the Vite dev server, driven by Chromium.
// Start both with script/e2e-smoke.sh, or point FRONT/API at running servers. Needs `playwright`
// resolvable from this folder (npx playwright install chromium once). Seed accounts come from the
// backend's local-profile DataInitializer, so run it only against a throwaway database.
const { chromium } = require('playwright');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const FRONT = process.env.FRONT || 'http://127.0.0.1:3000';
const API = process.env.API || 'http://127.0.0.1:8080';
const OUT = path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });

const results = [];
let page;
async function check(name, fn) {
  try {
    const ok = await fn();
    results.push({ name, ok: ok !== false });
    console.log((ok !== false ? 'PASS' : 'FAIL') + '  ' + name);
    if (ok === false) await page.screenshot({ path: path.join(OUT, 'fail-' + results.length + '.png'), fullPage: true });
  } catch (e) {
    results.push({ name, ok: false, error: e.message });
    console.log('FAIL  ' + name + ' :: ' + e.message.split('\n')[0].slice(0, 160));
    try { await page.screenshot({ path: path.join(OUT, 'fail-' + results.length + '.png'), fullPage: true }); } catch {}
  }
}

async function api(method, p, body, token, extraHeaders = {}) {
  const res = await fetch(API + p, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...extraHeaders },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, json };
}

// A real PNG so the upload passes the backend's image validation.
function png(width, height, rgb) {
  const crcTable = [];
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcTable[n] = c >>> 0; }
  const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) { raw[y * (width * 3 + 1)] = 0; for (let x = 0; x < width; x++) { const o = y * (width * 3 + 1) + 1 + x * 3; const dark = (x + y) % 2 === 0; raw[o] = dark ? rgb[0] : 240; raw[o + 1] = dark ? rgb[1] : 240; raw[o + 2] = dark ? rgb[2] : 240; } }
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'ko-KR' });
  page = await ctx.newPage();
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push('PAGEERROR ' + e.message.slice(0, 160)));
  await page.addInitScript(() => { localStorage.setItem('ruxpress_locale', 'ko'); localStorage.setItem('ruxpress_locale_user_choice', '1'); });
  const shot = (name) => page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: true });
  const go = async (r) => { await page.goto(FRONT + r, { waitUntil: 'networkidle' }); await page.waitForTimeout(300); };

  // ───────────────────────── backend sanity + setup through the API ─────────────────────────
  let adminToken, userToken, userId;
  await check('backend answers (public notices endpoint)', async () => (await api('GET', '/api/v1/notices?page=0&size=1')).status === 200);
  await check('admin login (seeded account)', async () => {
    const r = await api('POST', '/api/v1/admin/auth/login', { email: 'admin@ruxpress.com', password: 'admin1234' });
    adminToken = r.json?.data?.token; return Boolean(adminToken);
  });
  await check('set manual exchange rates (RUB, USD)', async () => {
    const a = await api('POST', '/api/v1/exchange-rates/manual', { currency: 'RUB', rate: 17.52 }, adminToken);
    const b = await api('POST', '/api/v1/exchange-rates/manual', { currency: 'USD', rate: 1385.2 }, adminToken);
    return a.status === 200 && b.status === 200;
  });
  await check('create a pinned notice', async () => {
    const r = await api('POST', '/api/v1/admin/notices', { title: '11월 배송 일정 안내', content: '11월 둘째 주 배송은 하루 늦어집니다.', isPinned: true, status: 'PUBLISHED' }, adminToken);
    return r.status === 200 && r.json.code === 200;
  });
  await check('member login (seeded account) + address', async () => {
    const r = await api('POST', '/api/v1/users/login', { email: 'test1@test.com', password: 'test1' });
    userToken = r.json?.data?.token; userId = r.json?.data?.userId;
    if (!userToken) return false;
    const a = await api('POST', '/api/v1/users/me/addresses', { label: '집', recipientName: 'Иван Петров', recipientPhone: '+7 912 345-67-89', postalCode: '690091', addressLine1: 'Владивосток, ул. Светланская 12', addressLine2: 'кв. 45', isDefault: true }, userToken);
    return a.status === 200;
  });
  await check('admin credits the member wallet', async () => {
    const r = await api('POST', `/api/v1/admin/wallets/users/${userId}/credit`, { amount: 1000000, memo: 'E2E 테스트 충전' }, adminToken);
    return r.status === 200;
  });

  // ───────────────────────── admin registers products through the UI ─────────────────────────
  await go('/admin/login');
  await page.fill('#admin-email', 'admin@ruxpress.com');
  await page.fill('#admin-password', 'admin1234');
  await page.getByRole('button', { name: '로그인' }).click();
  await page.waitForURL('**/admin', { timeout: 15000 });
  await check('admin signs in through the UI', async () => page.url().endsWith('/admin'));

  const products = [
    { name: '경량 러닝화 (화이트/블랙)', shop: '브랜드 공식몰', url: 'https://example.com/shop/running-shoe', price: '129000', category: '신발', desc: '가볍고 쿠션이 좋은 데일리 러닝화입니다.', featured: true, image: png(64, 80, [20, 20, 20]) },
    { name: '수분 에센스 90ml', shop: '뷰티 편집숍', url: 'https://example.com/shop/essence', price: '127000', category: '뷰티', desc: '', featured: true, image: png(64, 80, [90, 90, 90]) },
    { name: '노이즈 캔슬링 무선 이어버드', shop: '전자 공식몰', url: 'https://example.com/shop/earbuds', price: '219000', category: '전자기기', desc: '', featured: false, image: null },
  ];
  for (const p of products) {
    await go('/admin/products');
    await page.getByRole('button', { name: '상품 등록' }).first().click();
    await page.waitForSelector('#product-name');
    await page.fill('#product-name', p.name);
    await page.fill('#product-shop', p.shop);
    await page.fill('#product-category', p.category);
    await page.fill('#product-url', p.url);
    await page.fill('#product-price', p.price);
    if (p.desc) await page.fill('#product-description', p.desc);
    if (p.featured) await page.click('#product-featured');
    if (p.image) await page.setInputFiles('input[type=file]', { name: 'photo.png', mimeType: 'image/png', buffer: p.image });
    await page.getByRole('button', { name: '저장' }).click();
    await page.waitForTimeout(1500);
    await check(`admin UI registers "${p.name}"`, async () => (await page.getByRole('cell', { name: new RegExp(p.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).count()) > 0);
  }
  await shot('01-admin-products');
  await check('uploaded image is served by the backend', async () => {
    const r = await api('GET', '/api/v1/products?size=10');
    const withImg = r.json.data.content.filter((x) => x.imageUrl);
    if (withImg.length !== 2) return false;
    const img = await fetch(FRONT + withImg[0].imageUrl);
    return img.status === 200 && (img.headers.get('content-type') || '').startsWith('image/');
  });

  // ───────────────────────── guest browses ─────────────────────────
  await ctx.clearCookies();
  await page.evaluate(() => { localStorage.removeItem('ruxpress_token'); sessionStorage.clear(); localStorage.removeItem('ruxpress_admin'); });
  await go('/');
  await check('landing shows the announcement rate and the categories', async () =>
    (await page.getByText('1 RUB = 17.52 KRW').count()) > 0 && (await page.getByRole('link', { name: /신발/ }).count()) > 0);
  await check('landing showcase uses the uploaded product photo', async () => (await page.locator('section img[src*="/files/"], section img[src*="/api/"]').count()) > 0);
  await shot('02-landing-real');
  await go('/products');
  await check('catalogue lists the three products', async () => (await page.locator('a.group h3').count()) === 3);
  await page.getByRole('button', { name: '뷰티', exact: true }).click();
  await page.waitForTimeout(800);
  await check('category filter keeps one product and updates the URL', async () => page.url().includes('category=') && (await page.locator('a.group h3').count()) === 1);
  await go('/products?keyword=' + encodeURIComponent('이어버드'));
  await check('keyword search finds the earbuds', async () => (await page.locator('a.group h3').count()) === 1 && (await page.locator('a.group h3').first().textContent()).includes('이어버드'));
  await go('/products?sort=priceDesc');
  await check('price sort puts the most expensive first', async () => (await page.locator('a.group h3').first().textContent()).includes('이어버드'));
  await go('/products?sort=priceAsc');
  await check('price sort ascending puts the essence first', async () => (await page.locator('a.group h3').first().textContent()).includes('에센스'));

  // product page + view counter
  const list = (await api('GET', '/api/v1/products?size=10')).json.data.content;
  const shoe = list.find((x) => x.name.includes('러닝화'));
  const essence = list.find((x) => x.name.includes('에센스'));
  for (let i = 0; i < 3; i++) await go(`/products/${shoe.id}`);
  await check('product page renders name, price and the rouble estimate', async () =>
    (await page.getByRole('heading', { name: /러닝화/ }).count()) > 0 && (await page.getByText('₩129,000').count()) > 0 && (await page.getByText(/≈ ₽/).count()) > 0);
  await shot('03-product-real');
  await check('view counter increments on each visit', async () => {
    const r = await api('GET', `/api/v1/admin/products?size=10`, undefined, adminToken);
    const row = r.json.data.content.find((x) => x.id === shoe.id);
    return row.viewCount >= 3;
  });
  await go('/products?sort=popular');
  await check('popular sort puts the viewed shoe first', async () => (await page.locator('a.group h3').first().textContent()).includes('러닝화'));

  // ───────────────────────── wishlist with the login gate ─────────────────────────
  await go(`/products/${shoe.id}`);
  await page.locator('button[aria-pressed]').first().click();
  await page.waitForTimeout(500);
  await check('guest heart opens the login sheet', async () => (await page.locator('#login-email, [role=dialog] input[type=email]').count()) > 0);
  await page.locator('[role=dialog] input[type=email]').fill('test1@test.com');
  await page.locator('[role=dialog] input[type=password]').fill('test1');
  await page.locator('[role=dialog] button[type=submit]').click();
  await page.waitForTimeout(1500);
  await check('after signing in the visitor is still on the product page', async () => page.url().includes(`/products/${shoe.id}`));
  await page.locator('button[aria-pressed]').first().click();
  await page.waitForTimeout(800);
  await check('heart saves the product (pressed + header count 1)', async () =>
    (await page.locator('button[aria-pressed="true"]').count()) > 0 && (await page.getByRole('link', { name: '찜한 상품' }).first().textContent()).includes('1'));
  await go('/wishlist');
  await check('wishlist page lists the saved shoe', async () => (await page.getByText('경량 러닝화').count()) > 0);
  await shot('04-wishlist-real');
  await page.getByRole('checkbox').first().click();
  await page.getByRole('button', { name: '선택 상품으로 구매 요청' }).click();
  await page.waitForURL('**/purchase/new**', { timeout: 10000 });
  await page.waitForTimeout(1000);
  await check('purchase form opens prefilled from the wishlist', async () => (await page.locator('input[value="https://example.com/shop/running-shoe"]').count()) > 0);
  await shot('05-purchase-prefilled-real');

  // submit the purchase request for real
  await page.getByRole('button', { name: '구매 요청 제출' }).click();
  await page.waitForTimeout(2500);
  await check('purchase request is accepted and lands on the list', async () => page.url().includes('/purchase') && !page.url().includes('/new'));
  await shot('06-purchase-list-real');
  await check('member list and admin list both show the new request', async () => {
    const mine = await api('GET', '/api/v1/purchases?page=0&size=5', undefined, userToken);
    const admin = await api('GET', '/api/v1/admin/purchases?page=0&size=5', undefined, adminToken);
    return mine.json.data.totalElements >= 1 && admin.json.data.totalElements >= 1;
  });
  await check('wallet balance went down by the estimate', async () => {
    const r = await api('GET', '/api/v1/balances/me', undefined, userToken);
    const bal = Number(r.json.data?.balance ?? r.json.data?.balanceKrw ?? r.json.data);
    return Number.isFinite(bal) && bal < 1000000;
  });

  // ───────────────────────── notices + hiding a product ─────────────────────────
  await go('/notice');
  await check('notice list shows the pinned notice', async () => (await page.getByText('11월 배송 일정 안내').count()) > 0);
  await check('admin hides the essence and the catalogue drops it', async () => {
    const r = await api('PUT', `/api/v1/admin/products/${essence.id}`, { name: essence.name, shopName: essence.shopName, productUrl: essence.productUrl, priceKrw: essence.priceKrw, category: essence.category, status: 'HIDDEN', isFeatured: essence.isFeatured, sortOrder: essence.sortOrder }, adminToken);
    if (r.status !== 200) return false;
    await go('/products');
    return (await page.locator('a.group h3').count()) === 2;
  });
  await go(`/products/${essence.id}`);
  await check('hidden product page shows the not-found state', async () => (await page.getByText('상품을 찾을 수 없습니다').count()) > 0 || (await page.getByRole('link', { name: '상품 목록으로' }).count()) > 0);

  // header search + logout
  await go('/');
  await page.getByRole('button', { name: '검색' }).first().click();
  await page.keyboard.type('러닝화');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  await check('header search lands on the results page', async () => page.url().includes('keyword=') && (await page.locator('a.group h3').count()) === 1);
  await page.getByRole('button', { name: '로그아웃' }).first().click();
  await page.waitForTimeout(800);
  await check('logout returns to the guest landing', async () => (await page.getByRole('link', { name: '로그인' }).count()) > 0);

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (consoleErrors.length) console.log('page errors:', consoleErrors.slice(0, 5));
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
  process.exit(failed.length ? 1 : 0);
})();
