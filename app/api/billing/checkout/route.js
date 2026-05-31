import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getBillingPlan } from '../../../../lib/plans';

export const runtime = 'nodejs';

function getSupabaseClient() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
      },
    }
  );
}

async function getUser(req, supabase) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token || !supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error) {
    return null;
  }

  return data.user;
}

export async function POST(req) {
  const body = await req.json();
  const plan = getBillingPlan(body.planId);

  if (plan.id === 'free') {
    return NextResponse.json(
      { success: false, error: 'Free Trial 不需要付款。' },
      { status: 400 }
    );
  }

  const supabase = getSupabaseClient();
  const user = await getUser(req, supabase);

  if (!user) {
    return NextResponse.json(
      { success: false, error: '請先登入再升級方案。' },
      { status: 401 }
    );
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      {
        success: false,
        error: '尚未設定 Stripe 金鑰。請先設定 STRIPE_SECRET_KEY 與價格 ID。',
      },
      { status: 500 }
    );
  }

  const priceId = process.env[plan.checkoutPriceIdEnv];

  if (!priceId) {
    return NextResponse.json(
      { success: false, error: `尚未設定 ${plan.checkoutPriceIdEnv}。` },
      { status: 500 }
    );
  }

  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL;

  const checkout = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: user.email,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      user_id: user.id,
      plan_id: plan.id,
    },
    subscription_data: {
      metadata: {
        user_id: user.id,
        plan_id: plan.id,
      },
    },
    success_url: `${origin}/?checkout=success`,
    cancel_url: `${origin}/?checkout=cancelled`,
  });

  return NextResponse.json({ success: true, url: checkout.url });
}
