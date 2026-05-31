import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

export async function POST(req) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { success: false, error: 'Stripe webhook 尚未設定。' },
      { status: 500 }
    );
  }

  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const signature = req.headers.get('stripe-signature');
  const payload = await req.text();

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Webhook signature verification failed.' },
      { status: 400 }
    );
  }

  const supabase = getSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      { success: false, error: 'Supabase 尚未設定。' },
      { status: 500 }
    );
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.user_id;
    const planId = session.metadata?.plan_id;

    if (userId && planId) {
      await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          plan_id: planId,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
        })
        .eq('id', userId);
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    const userId = subscription.metadata?.user_id;

    if (userId) {
      await supabase
        .from('profiles')
        .update({
          subscription_status: 'cancelled',
          plan_id: 'free',
          stripe_subscription_id: null,
        })
        .eq('id', userId);
    }
  }

  return NextResponse.json({ received: true });
}
