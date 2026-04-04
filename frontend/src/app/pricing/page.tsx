'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { onAuthChange, User } from '@/lib/firebase';
import { getUserData, createOrder, captureOrder } from '@/lib/api';

export default function Pricing() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [activeTab] = useState<'subscription'>('subscription');
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        const data = await getUserData(user.uid);
        if (data) setUserCredits(data.credits);
      }
    });
    return () => unsubscribe();
  }, []);

  // 处理 URL 参数（支付回调）
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const canceled = params.get('canceled');
    const orderId = params.get('token');
    const plan = params.get('plan');
    const uid = params.get('uid');

    if (success === '1' && orderId && uid && plan && user) {
      // 捕获订单
      const doCapture = async () => {
        const result = await captureOrder(orderId, uid, plan);
        if (result?.success) {
          setMessage({ type: 'success', text: `✅ 购买成功！已获得 ${result.addedCredits} Credits` });
          setUserCredits(result.credits || null);
        } else {
          setMessage({ type: 'error', text: '❌ 支付验证失败，请联系客服' });
        }
        // 清理 URL
        window.history.replaceState({}, '', '/pricing');
      };
      if (user.uid === uid) doCapture();
    } else if (canceled === '1') {
      setMessage({ type: 'error', text: '⚠️ 支付已取消' });
      window.history.replaceState({}, '', '/pricing');
    }
  }, [user]);

  const handlePurchase = async (plan: string) => {
    if (!user) {
      setMessage({ type: 'error', text: '请先登录后再购买' });
      return;
    }
    setPurchasing(plan);
    try {
      const order = await createOrder(user.uid, plan);
      if (order?.approveUrl) {
        window.location.href = order.approveUrl;
      } else {
        setMessage({ type: 'error', text: '创建订单失败，请重试' });
        setPurchasing(null);
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误，请重试' });
      setPurchasing(null);
    }
  };

  const subscriptions = [
    {
      name: 'Basic',
      price: 2.99,
      period: '月',
      credits: 5,
      description: '轻度使用',
      popular: false,
    },
    {
      name: 'Starter',
      price: 4.99,
      period: '月',
      credits: 12,
      description: '日常使用',
      popular: false,
    },
    {
      name: 'Pro',
      price: 9.99,
      period: '月',
      credits: 25,
      description: '重度使用',
      popular: true,
    },
    {
      name: 'Unlimited',
      price: 19.99,
      period: '月',
      credits: 50,
      description: '专业用户',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">🪄</span>
          <span className="text-white font-bold text-lg tracking-tight">图片背景移除</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">首页</Link>
          <Link href="/pricing" className="text-blue-400 hover:text-blue-300 text-sm transition-colors font-medium">定价</Link>
          <Link href="/faq" className="text-slate-400 hover:text-white text-sm transition-colors">常见问题</Link>
          <Link href="/blog" className="text-slate-400 hover:text-white text-sm transition-colors">博客</Link>
          <Link href="/about" className="text-slate-400 hover:text-white text-sm transition-colors">关于</Link>
          {user && (
            <Link href="/profile" className="text-slate-400 hover:text-white text-sm transition-colors">个人中心</Link>
          )}
        </nav>

        <div className="flex items-center">
          {user ? (
            <Link href="/profile" className="flex items-center gap-2">
              {user.photoURL && (
                <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-full ring-2 ring-blue-400/50" />
              )}
            </Link>
          ) : (
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-gray-700 text-sm font-medium rounded-lg transition-all"
            >
              登录
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-12 max-w-4xl mx-auto">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">简单透明的定价</h1>
          <p className="text-slate-400 text-lg">
            按需购买，无隐藏费用
          </p>
          {userCredits !== null && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full">
              <span className="text-blue-300">💰 您当前有</span>
              <span className="text-blue-400 font-bold">{userCredits} Credits</span>
            </div>
          )}

          {message && (
            <div className={`mt-4 px-4 py-3 rounded-xl text-center text-sm ${
              message.type === 'success' ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300' : 'bg-red-500/20 border border-red-500/40 text-red-300'
            }`}>
              {message.text}
            </div>
          )}
        </div>

        {/* Monthly Subscription */}
        {activeTab === 'subscription' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {subscriptions.map((sub) => (
              <div
                key={sub.name}
                className={`relative rounded-2xl p-6 flex flex-col ${
                  sub.popular
                    ? 'bg-gradient-to-b from-blue-500/20 to-slate-800/50 border-2 border-blue-500/50'
                    : 'bg-slate-800/50 border border-slate-700/50'
                }`}
              >
                {sub.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="px-4 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                      推荐
                    </span>
                  </div>
                )}

                <div className="text-center mb-4">
                  <h2 className="text-lg font-bold text-white mb-1">{sub.name}</h2>
                  <p className="text-slate-400 text-sm">{sub.description}</p>
                </div>

                <div className="text-center mb-4 flex-grow">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-white">${sub.price}</span>
                    <span className="text-slate-400">/{sub.period}</span>
                  </div>
                  <div className="text-blue-400 font-medium mt-2">
                    每月 {sub.credits} Credits
                  </div>
                </div>

                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-slate-300 text-sm">
                    <span className="text-blue-400">✓</span>
                    每月 {sub.credits} Credits
                  </li>
                  <li className="flex items-center gap-2 text-slate-300 text-sm">
                    <span className="text-blue-400">✓</span>
                    自动续费
                  </li>
                  <li className="flex items-center gap-2 text-slate-300 text-sm">
                    <span className="text-blue-400">✓</span>
                    随时取消
                  </li>
                  <li className="flex items-center gap-2 text-slate-300 text-sm">
                    <span className="text-blue-400">✓</span>
                    无广告
                  </li>
                </ul>

                <button
                  onClick={() => handlePurchase(sub.name.toLowerCase())}
                  disabled={purchasing === sub.name.toLowerCase()}
                  className={`w-full py-3 rounded-xl font-semibold transition-all disabled:opacity-50 ${
                  sub.popular
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg'
                    : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}>
                  {purchasing === sub.name.toLowerCase() ? '跳转中...' : `订阅 ${sub.name}`}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Free Usage Info */}
        <div className="mt-12 bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-bold text-white mb-4 text-center">免费使用</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-2xl mb-2">👤</div>
              <div className="text-white font-medium">未登录</div>
              <div className="text-blue-400 font-bold text-xl">1 次/天</div>
              <div className="text-slate-400 text-sm mt-1">游客身份使用</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🔐</div>
              <div className="text-white font-medium">注册账号</div>
              <div className="text-blue-400 font-bold text-xl">3 次/天 + 3 Credits</div>
              <div className="text-slate-400 text-sm mt-1">登录即得额外赠送</div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-8 bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-bold text-white mb-4">常见问题</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="text-slate-300 font-medium mb-1">积分会过期吗？</h4>
              <p className="text-slate-400">积分包购买后永久有效，没有过期时间。</p>
            </div>
            <div>
              <h4 className="text-slate-300 font-medium mb-1">如何取消订阅？</h4>
              <p className="text-slate-400">随时可在个人中心取消，取消后不再续费。</p>
            </div>
            <div>
              <h4 className="text-slate-300 font-medium mb-1">支持什么支付方式？</h4>
              <p className="text-slate-400">支持 PayPal、信用卡（Visa/Mastercard）等。</p>
            </div>
            <div>
              <h4 className="text-slate-300 font-medium mb-1">可以退款吗？</h4>
              <p className="text-slate-400">订阅7天内可申请退款，积分包未使用可退。</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-600 py-6">
        图片仅在浏览器与 API 之间传输，不经过任何服务器
      </footer>
    </div>
  );
}
