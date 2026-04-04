'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthChange, createOrUpdateUser, getUserData, logOut, User } from '@/lib/firebase';

interface UserProfileData {
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: { seconds: number } | null;
  lastLoginAt: { seconds: number } | null;
  usageCount: number;
  monthlyUsage: number;
}

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setUser(user);
      setLoading(false);
      
      if (user) {
        // 创建或更新用户数据
        await createOrUpdateUser(user);
        // 获取用户数据
        const data = await getUserData(user.uid);
        setProfileData(data as UserProfileData | null);
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

  const formatDate = (timestamp: { seconds: number } | null) => {
    if (!timestamp) return '-';
    return new Date(timestamp.seconds * 1000).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 未登录
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

  // 加载中
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
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">个人中心</h1>
          <p className="text-slate-400 text-sm mt-1">管理您的账户信息</p>
        </div>

        {/* 账户信息卡片 */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <span>👤</span> 账户信息
          </h2>
          
          <div className="flex items-start gap-6">
            {/* 头像 */}
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

            {/* 信息列表 */}
            <div className="flex-1 space-y-4">
              <InfoItem label="显示名称" value={user?.displayName || '未设置'} />
              <InfoItem label="邮箱" value={user?.email || '-'} />
              <InfoItem label="注册时间" value={formatDate(profileData?.createdAt || null)} />
              <InfoItem label="最后登录" value={formatDate(profileData?.lastLoginAt || null)} />
            </div>
          </div>
        </div>

        {/* 使用统计卡片 */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <span>📊</span> 使用统计
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="累计使用次数" value={profileData?.usageCount || 0} />
            <StatCard label="本月使用次数" value={profileData?.monthlyUsage || 0} />
          </div>
        </div>

        {/* 安全操作 */}
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

// 信息行组件
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
      <span className="text-slate-400 text-sm sm:w-24 flex-shrink-0">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

// 统计卡片组件
function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-slate-700/30 rounded-xl p-4 text-center">
      <div className="text-3xl font-bold text-blue-400 mb-1">{value}</div>
      <div className="text-slate-400 text-sm">{label}</div>
    </div>
  );
}

// Header 组件
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

// Footer 组件
function Footer() {
  return (
    <footer className="text-center text-xs text-slate-600 py-6">
      图片仅在浏览器与 API 之间传输，不经过任何服务器
    </footer>
  );
}
