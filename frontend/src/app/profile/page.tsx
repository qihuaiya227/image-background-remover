'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthChange, logOut, User } from '@/lib/firebase';
import { createOrUpdateUser, getUserData, type UserProfile } from '@/lib/api';

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setUser(user);
      setLoading(false);
      
      if (user) {
        await createOrUpdateUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        });
        const data = await getUserData(user.uid);
        setProfileData(data);
        setDataLoading(false);
      } else {
        setDataLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await logOut();
    router.push('/');
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return '-';
    return new Date(timestamp * 1000).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-6">🔒</div>
            <h1 className="text-2xl font-bold text-white mb-3">请先登录</h1>
            <p className="text-slate-400 mb-8">登录后可查看您的个人中心</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all"
            >
              返回首页
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-white flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            加载中...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col">
      <Header user={user} />
      
      <main className="flex-1 px-6 py-10 max-w-3xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">个人中心</h1>
          <p className="text-slate-400 text-sm mt-1">管理您的账户信息</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <span>👤</span> 账户信息
          </h2>
          
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || ''} 
                  className="w-24 h-24 rounded-full ring-4 ring-blue-500/30"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center text-4xl">
                  👤
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <InfoItem label="显示名称" value={user?.displayName || '未设置'} />
              <InfoItem label="邮箱" value={user?.email || '-'} />
              <InfoItem label="注册时间" value={formatDate(profileData?.created_at || null)} />
              <InfoItem label="最后登录" value={formatDate(profileData?.last_login_at || null)} />
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <span>💰</span> Credits 余额
          </h2>
          
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="剩余 Credits" value={profileData?.credits || 0} />
            <StatCard label="累计使用" value={profileData?.usage_count || 0} />
            <StatCard label="本月使用" value={profileData?.monthly_usage || 0} />
          </div>

          {profileData && profileData.credits <= 5 && profileData.credits > 0 && (
            <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <p className="text-amber-300 text-sm text-center">
                ⚠️ Credits 即将用完，请及时充值
              </p>
            </div>
          )}

          <Link
            href="/pricing"
            className="block w-full mt-4 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all text-center"
          >
            💳 购买更多 Credits
          </Link>
        </div>

        <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <span>⚙️</span> 账户操作
          </h2>
          
          <div className="space-y-3">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-all text-white"
            >
              <span className="flex items-center gap-3">
                <span>🚪</span>
                退出登录
              </span>
              <span className="text-slate-400">→</span>
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
      <span className="text-slate-400 text-sm sm:w-24 flex-shrink-0">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-slate-700/30 rounded-xl p-4 text-center">
      <div className="text-3xl font-bold text-blue-400 mb-1">{value}</div>
      <div className="text-slate-400 text-sm">{label}</div>
    </div>
  );
}

function Header({ user }: { user?: User | null }) {
  return (
    <header className="w-full px-6 py-4 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2">
        <span className="text-xl">🪄</span>
        <span className="text-white font-bold text-lg tracking-tight">图片背景移除</span>
      </Link>

      <nav className="hidden md:flex items-center gap-8">
        <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">首页</Link>
        <Link href="/faq" className="text-slate-400 hover:text-white text-sm transition-colors">常见问题</Link>
        <Link href="/blog" className="text-slate-400 hover:text-white text-sm transition-colors">博客</Link>
        <Link href="/about" className="text-slate-400 hover:text-white text-sm transition-colors">关于</Link>
      </nav>

      <div className="flex items-center">
        {user ? (
          <Link href="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            {user.photoURL && (
              <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-full ring-2 ring-blue-400/50" />
            )}
            <span className="text-slate-300 text-sm font-medium hidden sm:block">{user.displayName}</span>
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
  );
}

function Footer() {
  return (
    <footer className="text-center text-xs text-slate-600 py-6">
      图片仅在浏览器与 API 之间传输，不经过任何服务器
    </footer>
  );
}
