import Link from 'next/link';

export default function Blog() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col">
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xl">🪄</span>
          <span className="text-white font-bold text-lg">图片背景移除</span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">首页</Link>
          <Link href="/faq" className="text-slate-400 hover:text-white text-sm transition-colors">FAQ</Link>
          <Link href="/blog" className="text-white text-sm font-medium">Blog</Link>
          <Link href="/about" className="text-slate-400 hover:text-white text-sm transition-colors">About</Link>
        </nav>
        <div className="w-20" />
      </header>
      <main className="flex-1 flex flex-col items-center px-6 py-16">
        <div className="max-w-2xl w-full">
          <h1 className="text-3xl font-bold text-white mb-8">博客</h1>
          <div className="space-y-6">
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <p className="text-slate-500 text-xs mb-2">2026-04-03</p>
              <h3 className="text-white font-semibold text-lg mb-2">图片背景移除工具上线</h3>
              <p className="text-slate-400 text-sm">基于 AI 的图片背景移除工具正式上线，支持一键去除背景，完全免费。</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
