# 跨境社群文案生成器

這是一個 Next.js MVP，可以讓客戶用產品描述或產品圖片 URL，產生 3 種在地化社群文案。前端已包含客戶會用到的基本流程：

- Vibe & Hook
- Pain Point & Solution
- Specs, Value & Trust
- 方案與額度顯示
- 文案庫保存
- BYOK 使用者 ID 設定
- 8 國語言：Traditional Chinese (TW)、English (US)、Japanese (JP)、Korean (KR)、German (DE)、French (FR)、Spanish (ES)、Thai (TH)
- 多平台輸出：Instagram、TikTok、Pinterest、Facebook、X、YouTube Shorts、Shopify、Amazon、Etsy、Email
- 行銷目標、品牌語氣、目標客群、SEO / Hashtag 關鍵字欄位
- Supabase Email 登入 / 註冊
- 雲端文案庫 API
- Stripe Checkout 付款入口
- Stripe webhook 訂閱狀態同步
- Terms、Privacy、Refund 基本頁
- `/api/health` 健康檢查 API

## 啟動方式

1. 安裝依賴

```bash
npm install
```

2. 建立 `.env.local`

```bash
OPENAI_API_KEY=sk-your-master-key
OPENAI_MODEL=gpt-4o-mini
```

如果要啟用 Supabase BYOK 查詢，再加上：

```bash
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

3. 設定 Stripe 付款

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_or_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_GROWTH_PRICE_ID=price_xxx
STRIPE_BYOK_PRICE_ID=price_xxx
STRIPE_AGENCY_PRICE_ID=price_xxx
```

Stripe webhook endpoint：

```text
https://your-domain.com/api/billing/webhook
```

需要監聽事件：

```text
checkout.session.completed
customer.subscription.deleted
```

4. 建立 Supabase 資料表

到 Supabase SQL Editor 執行：

```text
supabase/schema.sql
```

5. 開發模式

```bash
npm run dev
```

打開 `http://localhost:3000`。

## API

`POST /api/generate-copy`

```json
{
  "userId": "optional-supabase-user-id",
  "product": "A lightweight UV protection foldable sun hat for women.",
  "productImageUrl": "https://example.com/product.jpg",
  "targetLanguage": "Traditional Chinese (TW)",
  "targetPlatform": "Instagram",
  "targetAudience": "Women aged 25-40 who care about sun protection and travel style.",
  "campaignGoal": "Drive seasonal sales",
  "brandTone": "Friendly influencer",
  "keywords": "UPF50+, sun hat, travel essentials"
}
```

## 上線前建議

- Supabase Auth session 已有基礎版，正式上線時可移除手動 `userId` 欄位。
- 使用者自己的 API Key 建議加密後再存入資料庫。
- 若圖片不是公開 URL，請改用 Supabase Storage signed URL。
- Stripe Checkout 與 webhook 已有基礎版，正式上線前需到 Stripe 後台建立正式商品與價格。
- 文案庫已有雲端 API，正式上線時可補刪除、搜尋、標籤與分頁。

## 上架準備

已補上 [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md)，包含正式上線前需要完成的產品、技術、付款、法務與營運檢查項目。

部署步驟請看 [DEPLOYMENT.md](./DEPLOYMENT.md)。
