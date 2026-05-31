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

async function getUser(req, supabase) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error) {
    return null;
  }

  return data.user;
}

export async function GET(req) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ success: true, items: [] });
  }

  const user = await getUser(req, supabase);

  if (!user) {
    return NextResponse.json(
      { success: false, error: '請先登入。' },
      { status: 401 }
    );
  }

  const { data, error } = await supabase
    .from('generations')
    .select(
      'id, product, target_language, target_platform, campaign_goal, output_text, created_at'
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    return NextResponse.json(
      { success: false, error: '讀取文案庫失敗。' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, items: data });
}

export async function POST(req) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      { success: false, error: '尚未設定 Supabase。' },
      { status: 500 }
    );
  }

  const user = await getUser(req, supabase);

  if (!user) {
    return NextResponse.json(
      { success: false, error: '請先登入。' },
      { status: 401 }
    );
  }

  const body = await req.json();

  const { error } = await supabase.from('generations').insert({
    user_id: user.id,
    product: body.product || '',
    product_image_url: body.productImageUrl || '',
    target_language: body.targetLanguage,
    target_platform: body.targetPlatform,
    target_audience: body.targetAudience || '',
    campaign_goal: body.campaignGoal || '',
    brand_tone: body.brandTone || '',
    keywords: body.keywords || '',
    output_text: body.text,
  });

  if (error) {
    return NextResponse.json(
      { success: false, error: '保存文案失敗。' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
