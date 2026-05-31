import { NextResponse } from 'next/server';
import OpenAI from 'openai';
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

function isValidImageUrl(url) {
  if (!url) return true;

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

async function resolveApiKey(userId) {
  const fallbackKey = process.env.OPENAI_API_KEY;
  const supabase = getSupabaseClient();

  if (!supabase || !userId) {
    return fallbackKey;
  }

  const { data: userProfile, error } = await supabase
    .from('profiles')
    .select('subscription_status, user_api_key')
    .eq('id', userId)
    .single();

  if (error || !userProfile) {
    return fallbackKey;
  }

  if (
    userProfile.subscription_status === 'byok' &&
    userProfile.user_api_key
  ) {
    return userProfile.user_api_key;
  }

  return fallbackKey;
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

async function recordUsage({ supabase, userId, model }) {
  if (!supabase || !userId) return;

  await supabase.from('usage_events').insert({
    user_id: userId,
    event_type: 'generation',
    model,
  });
}

function buildSystemPrompt() {
  return `
You are a world-class cross-border e-commerce marketing expert and a master of international social media psychology.

Analyze the provided product description and/or product image, then generate exactly 3 high-converting social media copywriting versions in the requested target language.

Output exactly this structure:

1. [Vibe & Hook]
- Tone/Style: High energy, trendy, casual, influencer-style.
- Start with a powerful hook within the first 5 words.
- Use short paragraphs, line breaks, and emojis naturally.
- End with 3-5 relevant hashtags.

2. [Pain Point & Solution]
- Tone/Style: Empathize deeply with a daily frustration.
- Highlight pain points with brackets or bold text.
- Present the product naturally as the must-have solution.
- Create FOMO.
- End with a strong CTA and 3-5 relevant hashtags.

3. [Specs, Value & Trust]
- Tone/Style: Rational, authoritative, detail-oriented.
- Use clear bullet points.
- Focus on quality, specifications, materials, efficiency, value, and trust.
- End with 3-5 relevant hashtags.

Localization rules:
- English (US): catchy hooks, storytelling, direct value propositions, direct CTAs.
- Japanese (JP): 丁寧語, safety, meticulous product details, social proof, subtle recommendations.
- Korean (KR): trendy, aesthetic expressions, fast-trend language, must-have item vibes, youth culture slang.
- Traditional Chinese (TW): localized marketing terms, catchy slogans, high CP value, instant life-upgrading benefits.
- German (DE): precise, trustworthy, quality-focused, practical, clear value and compliance-friendly claims.
- French (FR): refined, lifestyle-led, elegant, benefit-driven, emotionally tasteful without sounding too loud.
- Spanish (ES): warm, energetic, social, community-oriented, clear benefit and confident CTA.
- Thai (TH): friendly, trend-aware, social-commerce oriented, approachable, value-focused, natural local phrasing.

Do not include explanations, notes, disclaimers, translations, or extra sections.
`.trim();
}

function buildUserContent({
  product,
  productImageUrl,
  targetLanguage,
  targetPlatform,
  targetAudience,
  campaignGoal,
  brandTone,
  keywords,
}) {
  const content = [
    {
      type: 'text',
      text: `
Product:
${product || 'No written description provided. Infer product details from the image.'}

Target Country/Language:
${targetLanguage}

Target Platform:
${targetPlatform}

Target Audience:
${targetAudience || 'Not specified. Infer the likely buyer from the product.'}

Campaign Goal:
${campaignGoal || 'Increase conversion'}

Brand Tone:
${brandTone || 'Premium and polished'}

SEO / Hashtag Keywords:
${keywords || 'Not specified. Choose relevant localized keywords.'}
`.trim(),
    },
  ];

  if (productImageUrl) {
    content.push({
      type: 'image_url',
      image_url: {
        url: productImageUrl,
        detail: 'auto',
      },
    });
  }

  return content;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const product = body.product?.trim() || '';
    const productImageUrl = body.productImageUrl?.trim() || '';
    const targetLanguage = body.targetLanguage?.trim() || '';
    const targetPlatform = body.targetPlatform?.trim() || '';
    const targetAudience = body.targetAudience?.trim() || '';
    const campaignGoal = body.campaignGoal?.trim() || '';
    const brandTone = body.brandTone?.trim() || '';
    const keywords = body.keywords?.trim() || '';
    const supabase = getSupabaseClient();
    const authUser = await getUser(req, supabase);
    const userId = authUser?.id || body.userId?.trim() || '';

    if ((!product && !productImageUrl) || !targetLanguage || !targetPlatform) {
      return NextResponse.json(
        {
          success: false,
          error: '請至少提供產品描述或圖片 URL，並選擇目標語言與平台。',
        },
        { status: 400 }
      );
    }

    if (!isValidImageUrl(productImageUrl)) {
      return NextResponse.json(
        {
          success: false,
          error: '產品圖片 URL 格式不正確。',
        },
        { status: 400 }
      );
    }

    const apiKey = await resolveApiKey(userId);

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: '尚未設定 OpenAI API Key。',
        },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey });
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: buildSystemPrompt(),
        },
        {
          role: 'user',
          content: buildUserContent({
            product,
            productImageUrl,
            targetLanguage,
            targetPlatform,
            targetAudience,
            campaignGoal,
            brandTone,
            keywords,
          }),
        },
      ],
      temperature: 0.8,
      max_tokens: 1200,
    });

    await recordUsage({ supabase, userId: authUser?.id, model });

    return NextResponse.json({
      success: true,
      text: completion.choices[0]?.message?.content || '',
    });
  } catch (error) {
    console.error('Generate copy failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: '文案生成失敗，請稍後再試。',
      },
      { status: 500 }
    );
  }
}
