'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { onAuthChange, User } from '@/lib/firebase';
import { getUserData } from '@/lib/api';

export default function Pricing() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'credits' | 'subscription'>('credits');

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

  const creditPacks = [
    {
      name: 'Starter',
      credits: 50,
      price: 3,
      description: '体验一下',
    },
    {
      name: 'Pro',
      credits: 200,
      price: 9,
      description: '日常使用',
      popular: true,
    },
    {
      name: 'Unlimited',
      credits: 800,
      price: 29,
      description: '重度使用',
    },
  ];

  const subscriptions = [
    {
      name: 'Starter',
      price: 4.99,
      period: '月',
      credits: 200,
      description: '轻度使用',
      popular: false,
    },
    {
      name: 'Pro',
      price: 9.99,
      period: '月',
      credits: 500,
      description: '日常使用',
      popular: true,
    },
    {
      name: 'Unlimited',
      price: 19.99,
      period: '月',
      credits: 1000,
      description: '重度使用',
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
            <Link href="/profile" className="text-blue-400 hover:text-blue-300 text-sm transition-colors font-medium">个人中心</Link>
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
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-slate-800/50 rounded-xl p-1 border border-slate-700/50">
            <button
              onClick={() => setActiveTab('credits')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'credits'
                  ? 'bg-blue-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              💎 积分包
            </button>
            <button
              onClick={() => setActiveTab('subscription')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'subscription'
                  ? 'bg-blue-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📅 月订阅
            </button>
          </div>
        </div>

        {/* Credits Packs */}
        {activeTab === 'credits' && (
          <>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {creditPacks.map((pack) => (
                <div
                  key={pack.name}
                  className={`rounded-2xl p-6 ${
                    pack.popular
                      ? 'bg-gradient-to-b from-blue-500/20 to-slate-800/50 border-2 border-blue-500/50'
                      : 'bg-slate-800/50 border border-slate-700/50'
                  }`}
                >
                  {pack.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="px-4 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                        最受欢迎
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <h2 className="text-lg font-bold text-white mb-1">{pack.name}</h2>
                    <p className="text-slate-400 text-sm">{pack.description}</p>
                  </div>

                  <div className="text-center mb-4">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-white">${pack.price}</span>
                    </div>
                    <div className="text-blue-400 font-medium mt-1">
                      {pack.credits} Credits
                    </div>
                    <div className="text-emerald-400 text-xs mt-1">
                      ≈ ${(pack.price / pack.credits).toFixed(3)} / 次
                    </div>
                  </div>

                  <ul className="space-y-2 mb-4">
                    <li className="flex items-center gap-2 text-slate-300 text-sm">
                      <span className="text-emerald-400">✓</span>
                      永久有效
                    </li>
                    <li className="flex items-center gap-2 text-slate-300 text-sm">
                      <span className="text-emerald-400">✓</span>
                      无过期时间
                    </li>
                    <li className="flex items-center gap-2 text-slate-300 text-sm">
                      <span className="text-emerald-400">✓</span>
                      无水印输出
                    </li>
                  </ul>

                  <button
                    className={`w-full py-3 rounded-xl font-semibold transition-all ${
                      pack.popular
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg'
                        : 'bg-slate-700 hover:bg-slate-600 text-white'
                    }`}
                  >
                    立即购买
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 text-center">
              <p className="text-slate-400 text-sm">
                💡 <span className="text-slate-300">积分永久有效</span>，一次购买，终身使用
              </p>
            </div>
          </>
        )}

        {/* Monthly Subscription */}
        {activeTab === 'subscription' && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {subscriptions.map((sub) => (
              <div
                key={sub.name}
                className={`rounded-2xl p-6 flex flex-col ${
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

                <button className={`w-full py-3 rounded-xl font-semibold transition-all ${
                  sub.popular
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg'
                    : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}>
                  订阅 {sub.name}
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
