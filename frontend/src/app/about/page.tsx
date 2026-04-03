import Link from 'next/link';

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col">
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xl">🪄</span>
          <span className="text-white font-bold text-lg">图片背景移除</span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">首页</Link>
          <Link href="/faq" className="text-slate-400 hover:text-white text-sm transition-colors">常见问题</Link>
          <Link href="/blog" className="text-slate-400 hover:text-white text-sm transition-colors">博客</Link>
          <Link href="/about" className="text-white text-sm font-medium">关于</Link>
        </nav>
        <div className="w-20" />
      </header>
      <main className="flex-1 flex flex-col items-center px-6 py-16">
        <div className="max-w-2xl w-full">
          <h1 className="text-3xl font-bold text-white mb-6">关于我们</h1>
          <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700 space-y-4">
            <p className="text-slate-300">🪄 图片背景移除是一款基于 AI 的在线工具，帮助用户一键去除图片背景。</p>
            <p className="text-slate-400 text-sm">完全免费，无需注册，即开即用。图片处理在浏览器端完成，不经过任何第三方服务器。</p>
            <div className="pt-4 border-t border-slate-700">
              <p className="text-slate-400 text-sm">技术栈：Next.js · Tailwind CSS · Firebase Auth · Remove.bg API</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
