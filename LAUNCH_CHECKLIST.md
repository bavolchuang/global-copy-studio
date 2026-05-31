# 上架準備清單

## 產品定位

- 產品名稱：Global Copy Studio
- 核心客群：跨境電商賣家、Shopify 店主、Amazon / Etsy 賣家、社群小編、品牌行銷團隊
- 核心價值：輸入產品資訊與圖片，快速產出符合 8 國市場語感的社群與商品文案

## MVP 已具備功能

- 8 國語言：台灣繁中、美國英文、日本、韓國、德國、法國、西班牙、泰國
- 多平台：Instagram、TikTok、Pinterest、Facebook、X、YouTube Shorts、Shopify、Amazon、Etsy、Email
- 產品描述與圖片 URL 分析
- 三種高轉換文案格式
- 目標客群、行銷目標、品牌語氣、SEO / Hashtag 關鍵字
- Supabase Email 登入 / 註冊
- 雲端文案庫 API
- Stripe Checkout 付款入口
- Stripe webhook 訂閱狀態同步
- Terms、Privacy、Refund 基本頁
- `/api/health` 健康檢查 API
- 方案與額度顯示雛形
- BYOK 使用者 ID 雛形

## 上架平台順序

1. Vercel：部署 Next.js SaaS 網站
2. Supabase：會員、用量、文案庫、BYOK 金鑰資料
3. Stripe 或 Lemon Squeezy：月費方案與付款
4. Product Hunt / SaaS directories：曝光與早期流量
5. Shopify App Store：第二階段，等 SaaS 有付費客戶後再做
6. Chrome Web Store：第三階段，做成瀏覽器外掛

## 正式上線前必做

- Supabase Auth session 基礎版已完成；正式上線前移除手動 `userId` 欄位
- 使用者 OpenAI API Key 必須加密保存
- 建立用量紀錄表，避免無限制消耗 API 成本
- Stripe Checkout 與 webhook 基礎版已完成；正式上線前需建立 live 商品價格與測試 webhook
- 文案庫已有 Supabase API；正式上線前補搜尋、刪除、標籤與分頁
- 增加錯誤追蹤與基本分析，例如轉換率、生成次數、熱門語言
- 準備 Terms of Service、Privacy Policy、Refund Policy
- 建立客服信箱與產品回饋入口

## 建議資料表

### profiles

- id
- email
- store_name
- subscription_status
- plan_id
- encrypted_user_api_key
- created_at

### generations

- id
- user_id
- product
- product_image_url
- target_language
- target_platform
- target_audience
- campaign_goal
- brand_tone
- keywords
- output_text
- created_at

### usage_events

- id
- user_id
- event_type
- token_estimate
- model
- created_at

## 方案建議

- Free Trial：每日 5 次，適合導流
- Growth：每月 120 次，使用平台主金鑰
- BYOK Pro：客戶自帶 API Key，你收軟體月費
- Agency：團隊帳號、多品牌、多成員、更多保存空間

## 首頁銷售文案方向

- Hero：Localized product copy for every market you sell in.
- Value：Turn one product photo into social copy for 8 global markets.
- CTA：Start generating free
- Trust：Built for cross-border sellers, Shopify brands, and marketplace teams.
