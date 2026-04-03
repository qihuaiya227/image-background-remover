'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { signInWithGoogle, logOut, onAuthChange, User } from '@/lib/firebase';

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<{ w: number; h: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Firebase Auth 监听登录状态
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ⚠️ 部署 Worker 后替换为真实 URL，或直接使用 Remove.bg API
  const USE_DIRECT_API = true;
  const API_URL = USE_DIRECT_API
    ? 'https://api.remove.bg/v1.0/removebg'
    : 'https://your-worker.xxx.workers.dev';
  const API_KEY = 'rgS4ibKB2p4aQd4GaNW2tTqE';

  const revokeOldResult = useCallback((url: string | null) => {
    if (url) URL.revokeObjectURL(url);
  }, []);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件（ JPG / PNG / WebP ）');
      return;
    }
    revokeOldResult(resultImage);
    setResultImage(null);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
      // 获取原始尺寸
      const img = new Image();
      img.onload = () => setOriginalSize({ w: img.width, h: img.height });
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleRemoveBg = async () => {
    if (!originalImage) return;

    setLoading(true);
    setError(null);
    revokeOldResult(resultImage);
    setResultImage(null);

    try {
      const res = await fetch(originalImage);
      const blob = await res.blob();

      const formData = new FormData();
      formData.append('image_file', blob, 'image.png');

      const headers: Record<string, string> = {};
      if (USE_DIRECT_API) {
        headers['X-Api-Key'] = API_KEY;
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `请求失败 (${response.status})`);
      }

      const resultBlob = await response.blob();
      const resultUrl = URL.createObjectURL(resultBlob);
      setResultImage(resultUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理失败，请检查网络');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    revokeOldResult(resultImage);
    setOriginalImage(null);
    setResultImage(null);
    setOriginalSize(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const a = document.createElement('a');
    a.href = resultImage;
    a.download = 'removed-bg.png';
    a.click();
  };

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      setError('登录失败: ' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  // 限制最大显示尺寸，保持比例
  const MAX_W = 400;
  const MAX_H = 320;
  const getScaledStyle = () => {
    if (!originalSize) return {};
    const { w, h } = originalSize;
    if (w <= MAX_W && h <= MAX_H) return { width: w, height: h };
    const ratio = Math.min(MAX_W / w, MAX_H / h);
    return { width: w * ratio, height: h * ratio };
  };
  const containerStyle: React.CSSProperties = getScaledStyle();

  if (authLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col items-center justify-center px-6 py-10">
        <div className="text-white">加载中...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col items-center px-6 py-10">
      {/* 顶部导航栏 */}
      <div className="w-full max-w-lg flex justify-between items-center mb-6">
        <div className="text-sm text-slate-400">
          {user ? (
            <div className="flex items-center gap-3">
              {user.photoURL && (
                <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-full" />
              )}
              <span className="text-slate-300">{user.displayName}</span>
            </div>
          ) : (
            <span className="text-slate-500">未登录</span>
          )}
        </div>
        {user ? (
          <button
            onClick={logOut}
            className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-all"
          >
            退出
          </button>
        ) : (
          <button
            onClick={handleSignIn}
            className="flex items-center gap-2 px-4 py-1.5 bg-white hover:bg-slate-100 text-gray-700 text-xs font-medium rounded-lg transition-all shadow"
          >
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              alt="Google" 
              className="w-4 h-4" 
            />
            Google 登录
          </button>
        )}
      </div>

      {/* 标题区 */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
          🪄 <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">图片背景移除</span>
        </h1>
        <p className="text-slate-400 text-sm">上传图片，AI 自动去除背景 · 完全免费</p>
      </div>

      {/* 上传区 — 未上传时显示 */}
      {!originalImage && (
        <div
          className={`
            w-full max-w-lg border-2 border-dashed rounded-3xl overflow-hidden cursor-pointer
            transition-all duration-300 min-h-80 flex flex-col items-center justify-center gap-4
            ${dragOver
              ? 'border-blue-400 bg-blue-500/10 scale-105'
              : 'border-slate-600 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800'}
          `}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-6xl">📤</div>
          <div className="text-center">
            <p className="text-white font-medium text-lg">点击或拖拽上传图片</p>
            <p className="text-slate-400 text-sm mt-1">支持 JPG、PNG、WebP</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {/* 主工作区 — 上传后显示 */}
      {originalImage && (
        <div className="w-full flex flex-col items-center gap-6">

          {/* 并排对比区 */}
          <div className="flex gap-4 items-start flex-wrap justify-center">

            {/* 原图 */}
            <div className="flex flex-col items-center gap-2">
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">原图</div>
              <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-700" style={containerStyle}>
                <img
                  src={originalImage}
                  alt="原图"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* 箭头指示 */}
            <div className="flex items-center pt-16">
              <div className="text-3xl text-slate-500">→</div>
            </div>

            {/* 结果图 */}
            <div className="flex flex-col items-center gap-2">
              <div className="text-xs text-emerald-400 font-medium uppercase tracking-wider">移除背景</div>
              <div
                className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-700"
                style={containerStyle}
              >
                {resultImage ? (
                  <div
                    className="w-full h-full bg-checkerboard"
                    style={{ backgroundSize: '16px 16px' }}
                  >
                    <img
                      src={resultImage}
                      alt="结果图"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500"
                  >
                    {loading ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">AI 处理中...</span>
                      </div>
                    ) : (
                      <span className="text-sm">点击下方按钮移除背景</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 操作按钮行 */}
          <div className="flex gap-4 items-center">
            <button
              onClick={handleRemoveBg}
              disabled={loading}
              className={`
                px-8 py-3 rounded-xl font-bold text-white text-sm
                transition-all duration-200 flex items-center gap-2 shadow-lg
                ${loading
                  ? 'bg-slate-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 active:scale-95'}
              `}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  AI 移除中...
                </>
              ) : (
                <>✨ 移除背景</>
              )}
            </button>

            <button
              onClick={handleReset}
              disabled={loading}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold text-slate-300 text-sm transition-all"
            >
              重新上传
            </button>

            {resultImage && !loading && (
              <button
                onClick={handleDownload}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-95 rounded-xl font-bold text-white text-sm transition-all shadow-lg flex items-center gap-2"
              >
                ⬇️ 下载 PNG
              </button>
            )}
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/40 text-red-300 rounded-xl px-5 py-3 text-sm max-w-lg text-center">
              ❌ {error}
            </div>
          )}

          {/* 提示 */}
          {resultImage && (
            <p className="text-slate-500 text-xs mt-2">
              图片尺寸与原图一致，透明背景 PNG 已保留 alpha 通道
            </p>
          )}
        </div>
      )}

      {/* 底部 */}
      <div className="mt-12 text-center text-xs text-slate-600">
        图片仅在浏览器与 API 之间传输，不经过任何服务器
      </div>
    </main>
  );
}
