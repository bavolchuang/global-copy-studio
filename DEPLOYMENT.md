# Deployment Guide

## Goal

Launch Global Copy Studio as a paid SaaS on:

- Vercel for the Next.js app
- Supabase for auth, profiles, copy library, usage records
- Stripe for subscriptions

## 1. Supabase

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
4. Copy these values into Vercel environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Recommended Auth settings:

- Enable Email login.
- For early testing, email confirmation can be disabled.
- For production, enable email confirmation.

## 2. OpenAI

Add:

```text
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

BYOK users can be added later by saving encrypted API keys into
`profiles.encrypted_user_api_key`.

## 3. Stripe

Create products and recurring prices:

- Growth, monthly, `$19`
- BYOK Pro, monthly, `$9`
- Agency, monthly, `$49`

Add the price IDs:

```text
STRIPE_SECRET_KEY=sk_live_or_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_GROWTH_PRICE_ID=price_...
STRIPE_BYOK_PRICE_ID=price_...
STRIPE_AGENCY_PRICE_ID=price_...
```

Webhook endpoint:

```text
https://your-domain.com/api/billing/webhook
```

Events:

```text
checkout.session.completed
customer.subscription.deleted
```

## 4. Vercel

1. Import the GitHub repository into Vercel.
2. Set all environment variables.
3. Deploy.
4. Add your production URL:

```text
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

5. Redeploy after setting the final URL.

## 5. Pre-Launch QA

- Visit `/api/health` and confirm it returns `ok: true`.
- Register a test user.
- Generate copy.
- Save to the cloud library.
- Start Stripe test checkout.
- Confirm webhook updates `profiles.plan_id`.
- Confirm Terms, Privacy, and Refund pages load:
  - `/terms`
  - `/privacy`
  - `/refund`

## 6. Launch Order

1. Private test with your own account.
2. Invite 3-5 sellers.
3. Fix onboarding friction.
4. Launch on Product Hunt and SaaS directories.
5. Start paid ads after checkout and retention are verified.
