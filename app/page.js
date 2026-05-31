'use client';

import {
  Archive,
  BarChart3,
  Check,
  Clipboard,
  CreditCard,
  Image,
  KeyRound,
  Library,
  Loader2,
  PenLine,
  Settings,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { billingPlans } from '../lib/plans';
import { createBrowserSupabaseClient } from '../lib/supabase-browser';

const languages = [
  'Traditional Chinese (TW)',
  'English (US)',
  'Japanese (JP)',
  'Korean (KR)',
  'German (DE)',
  'French (FR)',
  'Spanish (ES)',
  'Thai (TH)',
];

const platforms = [
  'Instagram',
  'TikTok',
  'Pinterest',
  'Facebook',
  'X',
  'YouTube Shorts',
  'Shopify Product Page',
  'Amazon Listing',
  'Etsy',
  'Email Campaign',
];

const campaignGoals = [
  'Increase conversion',
  'Launch new product',
  'Drive seasonal sales',
  'Build brand awareness',
  'Retarget warm shoppers',
];

const brandTones = [
  'Premium and polished',
  'Friendly influencer',
  'Bold and direct',
  'Minimal and elegant',
  'Youthful and trendy',
];

const plans = billingPlans;

const exampleText =
  '輕量、防曬、可折疊的女用遮陽帽。UPF50+，大帽沿，適合旅行、通勤、海邊與露營。';

function isLikelyDirectImageUrl(url) {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    return /\.(apng|avif|gif|jpe?g|png|webp)$/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

export default function Home() {
  const [activeView, setActiveView] = useState('generator');
  const [customerName, setCustomerName] = useState('Demo Store');
  const [planId, setPlanId] = useState('free');
  const [usedCount, setUsedCount] = useState(0);
  const [product, setProduct] = useState('');
  const [productImageUrl, setProductImageUrl] = useState('');
  const [targetLanguage, setTargetLanguage] = useState(languages[0]);
  const [targetPlatform, setTargetPlatform] = useState(platforms[0]);
  const [targetAudience, setTargetAudience] = useState('');
  const [campaignGoal, setCampaignGoal] = useState(campaignGoals[0]);
  const [brandTone, setBrandTone] = useState(brandTones[0]);
  const [keywords, setKeywords] = useState('');
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [session, setSession] = useState(null);
  const [result, setResult] = useState('');
  const [savedCopies, setSavedCopies] = useState([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const currentPlan = useMemo(
    () => plans.find((plan) => plan.id === planId) || plans[0],
    [planId]
  );

  const remaining = Math.max(currentPlan.limit - usedCount, 0);
  const usagePercent = Math.min((usedCount / currentPlan.limit) * 100, 100);
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  useEffect(() => {
    const stored = window.localStorage.getItem('copygen-demo-state');
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      setCustomerName(parsed.customerName || 'Demo Store');
      setPlanId(parsed.planId || 'free');
      setUsedCount(parsed.usedCount || 0);
      setSavedCopies(parsed.savedCopies || []);
      setUserId(parsed.userId || '');
    } catch {
      window.localStorage.removeItem('copygen-demo-state');
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!session) return;
    loadCloudLibrary(session.access_token);
  }, [session]);

  useEffect(() => {
    window.localStorage.setItem(
      'copygen-demo-state',
      JSON.stringify({
        customerName,
        planId,
        usedCount,
        savedCopies,
        userId,
      })
    );
  }, [customerName, planId, savedCopies, usedCount, userId]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setStatus('');
    setResult('');

    if (!product.trim() && !productImageUrl.trim()) {
      setError('請至少輸入產品描述或產品圖片 URL。');
      return;
    }

    if (remaining <= 0) {
      setError('本期額度已用完，請升級方案或切換 BYOK。');
      setActiveView('billing');
      return;
    }

    setLoading(true);
    setStatus('正在生成在地化社群文案...');

    try {
      const response = await fetch('/api/generate-copy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId.trim() || undefined,
          product: product.trim(),
          productImageUrl: productImageUrl.trim(),
          targetLanguage,
          targetPlatform,
          targetAudience: targetAudience.trim(),
          campaignGoal,
          brandTone,
          keywords: keywords.trim(),
        }),
        ...(session?.access_token
          ? { headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            } }
          : {}),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || '生成失敗，請稍後再試。');
      }

      setResult(data.text);
      setUsedCount((count) => count + 1);
      setStatus('完成。');
    } catch (err) {
      setError(err.message || '生成失敗，請稍後再試。');
      setStatus('');
    } finally {
      setLoading(false);
    }
  }

  async function copyText(text) {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setStatus('已複製到剪貼簿。');
  }

  async function saveResult() {
    if (!result) return;

    const item = {
      id: crypto.randomUUID(),
      title: product.slice(0, 34) || '未命名產品',
      language: targetLanguage,
      platform: targetPlatform,
      goal: campaignGoal,
      text: result,
      createdAt: new Date().toLocaleString('zh-TW'),
    };

    if (session?.access_token) {
      const response = await fetch('/api/library', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          product,
          productImageUrl,
          targetLanguage,
          targetPlatform,
          targetAudience,
          campaignGoal,
          brandTone,
          keywords,
          text: result,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || '保存文案失敗。');
        return;
      }

      await loadCloudLibrary(session.access_token);
      setStatus('已保存到雲端文案庫。');
      setActiveView('library');
      return;
    }

    setSavedCopies((items) => [item, ...items].slice(0, 12));
    setStatus('已保存到文案庫。');
    setActiveView('library');
  }

  async function loadCloudLibrary(token) {
    const response = await fetch('/api/library', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      setError(data.error || '讀取文案庫失敗。');
      return;
    }

    setSavedCopies(
      data.items.map((item) => ({
        id: item.id,
        title: item.product?.slice(0, 34) || '未命名產品',
        language: item.target_language,
        platform: item.target_platform,
        goal: item.campaign_goal,
        text: item.output_text,
        createdAt: new Date(item.created_at).toLocaleString('zh-TW'),
      }))
    );
  }

  async function signIn() {
    if (!supabase) {
      setError('尚未設定 Supabase 前端環境變數。');
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      return;
    }

    setStatus('已登入。');
    setError('');
  }

  async function signUp() {
    if (!supabase) {
      setError('尚未設定 Supabase 前端環境變數。');
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          store_name: customerName,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setStatus('註冊完成。若 Supabase 開啟信箱驗證，請先到信箱確認。');
    setError('');
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setStatus('已登出。');
  }

  async function startCheckout(nextPlanId) {
    if (nextPlanId === 'free') {
      selectPlan('free');
      return;
    }

    if (!session?.access_token) {
      setError('請先到設定頁登入，再升級方案。');
      setActiveView('settings');
      return;
    }

    const response = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ planId: nextPlanId }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      setError(data.error || '建立付款頁失敗。');
      return;
    }

    window.location.href = data.url;
  }

  function loadExample() {
    setProduct(exampleText);
    setTargetLanguage('Traditional Chinese (TW)');
    setTargetPlatform('Instagram');
    setTargetAudience('25-40 歲重視防曬、旅行與穿搭質感的女性消費者');
    setCampaignGoal('Drive seasonal sales');
    setBrandTone('Friendly influencer');
    setKeywords('UPF50+, 防曬帽, 旅行好物, 高CP值');
    setStatus('已載入範例產品。');
  }

  function selectPlan(nextPlanId) {
    setPlanId(nextPlanId);
    setUsedCount(0);
    setStatus('方案已切換，額度已重設。');
  }

  return (
    <main className="shell">
      <aside className="navRail">
        <div className="brand">
          <div className="mark">AI</div>
          <div>
            <h1>跨境文案工作台</h1>
            <p>{customerName}</p>
          </div>
        </div>

        <nav className="navList" aria-label="Main navigation">
          <button
            className={activeView === 'generator' ? 'navItem active' : 'navItem'}
            type="button"
            onClick={() => setActiveView('generator')}
          >
            <Sparkles size={18} />
            <span>生成器</span>
          </button>
          <button
            className={activeView === 'library' ? 'navItem active' : 'navItem'}
            type="button"
            onClick={() => setActiveView('library')}
          >
            <Library size={18} />
            <span>文案庫</span>
          </button>
          <button
            className={activeView === 'billing' ? 'navItem active' : 'navItem'}
            type="button"
            onClick={() => setActiveView('billing')}
          >
            <CreditCard size={18} />
            <span>方案與額度</span>
          </button>
          <button
            className={activeView === 'settings' ? 'navItem active' : 'navItem'}
            type="button"
            onClick={() => setActiveView('settings')}
          >
            <Settings size={18} />
            <span>設定</span>
          </button>
        </nav>

        <section className="usageBox">
          <div className="usageTop">
            <span>{currentPlan.name}</span>
            <strong>{remaining}</strong>
          </div>
          <div className="usageTrack">
            <div style={{ width: `${usagePercent}%` }} />
          </div>
          <p>本期剩餘生成次數</p>
        </section>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Cross-border Social Copy</p>
            <h2>{viewTitle(activeView)}</h2>
          </div>
          <div className="topbarActions">
            <button className="ghostButton" type="button" onClick={loadExample}>
              <PenLine size={17} />
              載入範例
            </button>
            <button
              className="primaryButton"
              type="button"
              onClick={() => setActiveView('generator')}
            >
              <Zap size={17} />
              新增文案
            </button>
          </div>
        </header>

        {(status || error) && (
          <div className={error ? 'notice error' : 'notice'}>{error || status}</div>
        )}

        {activeView === 'generator' && (
          <GeneratorView
            product={product}
            productImageUrl={productImageUrl}
            targetLanguage={targetLanguage}
            targetPlatform={targetPlatform}
            result={result}
            loading={loading}
            targetAudience={targetAudience}
            campaignGoal={campaignGoal}
            brandTone={brandTone}
            keywords={keywords}
            setProduct={setProduct}
            setProductImageUrl={setProductImageUrl}
            setTargetLanguage={setTargetLanguage}
            setTargetPlatform={setTargetPlatform}
            setTargetAudience={setTargetAudience}
            setCampaignGoal={setCampaignGoal}
            setBrandTone={setBrandTone}
            setKeywords={setKeywords}
            handleSubmit={handleSubmit}
            copyText={copyText}
            saveResult={saveResult}
          />
        )}

        {activeView === 'library' && (
          <LibraryView savedCopies={savedCopies} copyText={copyText} />
        )}

        {activeView === 'billing' && (
          <BillingView
            currentPlan={currentPlan}
            plans={plans}
            usedCount={usedCount}
            selectPlan={selectPlan}
            startCheckout={startCheckout}
          />
        )}

        {activeView === 'settings' && (
          <SettingsView
            customerName={customerName}
            userId={userId}
            email={email}
            password={password}
            session={session}
            supabaseEnabled={Boolean(supabase)}
            setCustomerName={setCustomerName}
            setUserId={setUserId}
            setEmail={setEmail}
            setPassword={setPassword}
            signIn={signIn}
            signUp={signUp}
            signOut={signOut}
          />
        )}
      </section>
    </main>
  );
}

function viewTitle(activeView) {
  if (activeView === 'library') return '保存過的文案';
  if (activeView === 'billing') return '方案與額度';
  if (activeView === 'settings') return '帳戶設定';
  return '產生在地化社群文案';
}

function GeneratorView({
  product,
  productImageUrl,
  targetLanguage,
  targetPlatform,
  result,
  loading,
  targetAudience,
  campaignGoal,
  brandTone,
  keywords,
  setProduct,
  setProductImageUrl,
  setTargetLanguage,
  setTargetPlatform,
  setTargetAudience,
  setCampaignGoal,
  setBrandTone,
  setKeywords,
  handleSubmit,
  copyText,
  saveResult,
}) {
  return (
    <div className="generatorGrid">
      <form className="panel formPanel" onSubmit={handleSubmit}>
        <div className="sectionTitle">
          <h3>
            <Sparkles size={19} />
            產品輸入
          </h3>
          <p>客戶只要貼上產品資訊，系統會自動匹配市場語氣。</p>
        </div>

        <div className="imagePreview">
          {isLikelyDirectImageUrl(productImageUrl) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={productImageUrl} alt="Product preview" />
          ) : productImageUrl ? (
            <div>
              <Image size={30} />
              <span>商品頁連結已加入</span>
            </div>
          ) : (
            <div>
              <Image size={30} />
              <span>產品圖片預覽</span>
            </div>
          )}
        </div>

        <div className="field">
          <label htmlFor="product">產品描述</label>
          <textarea
            id="product"
            value={product}
            onChange={(event) => setProduct(event.target.value)}
            placeholder="例如：輕量、防曬、可折疊的女用遮陽帽，適合旅行與日常通勤。"
          />
        </div>

        <div className="field">
          <label htmlFor="productImageUrl">產品圖片 URL</label>
          <input
            id="productImageUrl"
            value={productImageUrl}
            onChange={(event) => setProductImageUrl(event.target.value)}
            placeholder="https://example.com/product.jpg"
          />
        </div>

        <div className="twoCols">
          <div className="field">
            <label htmlFor="targetLanguage">目標國家／語言</label>
            <select
              id="targetLanguage"
              value={targetLanguage}
              onChange={(event) => setTargetLanguage(event.target.value)}
            >
              {languages.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="targetPlatform">目標平台</label>
            <select
              id="targetPlatform"
              value={targetPlatform}
              onChange={(event) => setTargetPlatform(event.target.value)}
            >
              {platforms.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="targetAudience">目標客群</label>
          <input
            id="targetAudience"
            value={targetAudience}
            onChange={(event) => setTargetAudience(event.target.value)}
            placeholder="例如：25-40 歲重視防曬、旅行與質感穿搭的女性"
          />
        </div>

        <div className="twoCols">
          <div className="field">
            <label htmlFor="campaignGoal">行銷目標</label>
            <select
              id="campaignGoal"
              value={campaignGoal}
              onChange={(event) => setCampaignGoal(event.target.value)}
            >
              {campaignGoals.map((goal) => (
                <option key={goal} value={goal}>
                  {goal}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="brandTone">品牌語氣</label>
            <select
              id="brandTone"
              value={brandTone}
              onChange={(event) => setBrandTone(event.target.value)}
            >
              {brandTones.map((tone) => (
                <option key={tone} value={tone}>
                  {tone}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="keywords">SEO / Hashtag 關鍵字</label>
          <input
            id="keywords"
            value={keywords}
            onChange={(event) => setKeywords(event.target.value)}
            placeholder="例如：UPF50+, summer hat, travel essentials"
          />
        </div>

        <button className="primaryButton wide" type="submit" disabled={loading}>
          {loading ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
          {loading ? '生成中...' : '生成 3 種文案'}
        </button>
      </form>

      <section className="panel resultPanel">
        <div className="resultHeader">
          <div>
            <h3>生成結果</h3>
            <p>可直接複製，或保存到文案庫給團隊後續使用。</p>
          </div>
          <div className="resultActions">
            <button className="ghostButton" type="button" onClick={() => copyText(result)} disabled={!result}>
              <Clipboard size={17} />
              複製
            </button>
            <button className="ghostButton" type="button" onClick={saveResult} disabled={!result}>
              <Archive size={17} />
              保存
            </button>
          </div>
        </div>

        <pre className={result ? 'output' : 'output empty'}>
          {result || '文案會顯示在這裡。'}
        </pre>
      </section>
    </div>
  );
}

function LibraryView({ savedCopies, copyText }) {
  if (!savedCopies.length) {
    return (
      <section className="panel emptyState">
        <h3>文案庫還是空的</h3>
        <p>生成結果保存後會出現在這裡，方便客戶回頭複製或比較不同市場版本。</p>
      </section>
    );
  }

  return (
    <section className="libraryGrid">
      {savedCopies.map((item) => (
        <article className="copyCard" key={item.id}>
          <div className="copyMeta">
            <strong>{item.title}</strong>
            <span>{item.createdAt}</span>
          </div>
        <p>
          {item.language} · {item.platform}
          {item.goal ? ` · ${item.goal}` : ''}
        </p>
        <pre>{item.text}</pre>
        <button className="ghostButton" type="button" onClick={() => copyText(item.text)}>
          <Clipboard size={17} />
          複製這份
        </button>
      </article>
      ))}
    </section>
  );
}

function BillingView({ currentPlan, plans, usedCount, selectPlan, startCheckout }) {
  return (
    <div className="billingGrid">
      {plans.map((plan) => (
        <article
          className={currentPlan.id === plan.id ? 'planCard selected' : 'planCard'}
          key={plan.id}
        >
          <div className="planTop">
            <h3>{plan.name}</h3>
            <strong>{plan.price}</strong>
          </div>
          <p>{plan.description}</p>
          <ul>
            {plan.features.map((feature) => (
              <li key={feature}>
                <Check size={16} />
                {feature}
              </li>
            ))}
          </ul>
          <button
            className="primaryButton wide"
            type="button"
            onClick={() => (plan.id === 'free' ? selectPlan(plan.id) : startCheckout(plan.id))}
          >
            <CreditCard size={17} />
            {currentPlan.id === plan.id
              ? '目前方案'
              : plan.id === 'free'
                ? '切換方案'
                : '升級並付款'}
          </button>
        </article>
      ))}

      <section className="panel billingSummary">
        <h3>
          <BarChart3 size={19} />
          本期使用狀態
        </h3>
        <p>
          目前方案為 <strong>{currentPlan.name}</strong>，本期已使用{' '}
          <strong>{usedCount}</strong> 次。
        </p>
        <p>
          正式上線時，這裡會串接 Stripe 付款、Supabase 訂閱狀態與用量紀錄。
        </p>
      </section>
    </div>
  );
}

function SettingsView({
  customerName,
  userId,
  email,
  password,
  session,
  supabaseEnabled,
  setCustomerName,
  setUserId,
  setEmail,
  setPassword,
  signIn,
  signUp,
  signOut,
}) {
  return (
    <section className="panel settingsPanel">
      <div className="sectionTitle">
        <h3>客戶帳戶</h3>
        <p>
          登入後，生成結果可以保存到 Supabase 文案庫。BYOK 金鑰正式上線時會加密保存。
        </p>
      </div>

      <div className={session ? 'authStatus signedIn' : 'authStatus'}>
        <strong>{session ? '已登入' : '尚未登入'}</strong>
        <span>
          {session?.user?.email ||
            (supabaseEnabled ? '可使用 Email 註冊或登入' : '尚未設定 Supabase 環境變數')}
        </span>
      </div>

      <div className="field">
        <label htmlFor="customerName">店鋪名稱</label>
        <input
          id="customerName"
          value={customerName}
          onChange={(event) => setCustomerName(event.target.value)}
        />
      </div>

      <div className="twoCols">
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="customer@example.com"
          />
        </div>

        <div className="field">
          <label htmlFor="password">密碼</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="至少 6 位數"
          />
        </div>
      </div>

      <div className="settingsActions">
        {session ? (
          <button className="ghostButton" type="button" onClick={signOut}>
            登出
          </button>
        ) : (
          <>
            <button className="primaryButton" type="button" onClick={signIn}>
              登入
            </button>
            <button className="ghostButton" type="button" onClick={signUp}>
              註冊
            </button>
          </>
        )}
      </div>

      <div className="field">
        <label htmlFor="userId">
          <KeyRound size={16} />
          Supabase 使用者 ID
        </label>
        <input
          id="userId"
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          placeholder="有 BYOK 會員資料時使用"
        />
      </div>
    </section>
  );
}
