import Link from 'next/link';

export default function FAQ() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col">
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xl">🪄</span>
          <span className="text-white font-bold text-lg">图片背景移除</span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">首页</Link>
          <Link href="/faq" className="text-white text-sm font-medium">FAQ</Link>
          <Link href="/blog" className="text-slate-400 hover:text-white text-sm transition-colors">Blog</Link>
          <Link href="/about" className="text-slate-400 hover:text-white text-sm transition-colors">About</Link>
        </nav>
        <div className="w-20" />
      </header>
      <main className="flex-1 flex flex-col items-center px-6 py-16">
        <div className="max-w-2xl w-full">
          <h1 className="text-3xl font-bold text-white mb-8">常见问题</h1>
          <div className="space-y-6">
            {[
              { q: '这个服务免费吗？', a: '是的，完全免费。图片在浏览器与 API 之间传输，不经过任何服务器。' },
              { q: '支持哪些图片格式？', a: '支持 JPG、PNG、WebP 格式。' },
              { q: '我的图片会被保存吗？', a: '不会。所有处理均在浏览器端完成，图片不会上传到任何服务器。' },
              { q: '如何联系开发者？', a: '可以通过 About 页面找到联系方式。' },
            ].map(({ q, a }) => (
              <div key={q} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <h3 className="text-white font-semibold mb-2">{q}</h3>
                <p className="text-slate-400 text-sm">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
