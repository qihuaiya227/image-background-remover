'use client';

import { useState, useRef, useCallback } from 'react';

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiUrl, setApiUrl] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 清理旧的 result URL
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
    reader.onload = (e) => setOriginalImage(e.target?.result as string);
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
    if (!originalImage || !apiUrl.trim()) {
      setError('请先上传图片并填写 API 地址');
      return;
    }

    setLoading(true);
    setError(null);
    revokeOldResult(resultImage);
    setResultImage(null);

    try {
      const res = await fetch(originalImage);
      const blob = await res.blob();

      const formData = new FormData();
      formData.append('image_file', blob, 'image.png');

      const response = await fetch(apiUrl.trim(), {
        method: 'POST',
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
      setError(err instanceof Error ? err.message : '处理失败，请检查 API 地址或网络');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    revokeOldResult(resultImage);
    setOriginalImage(null);
    setResultImage(null);
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex flex-col items-center px-4 py-10">
      {/* 标题 */}
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        🪄 图片背景移除
      </h1>
      <p className="text-gray-500 mb-8 text-sm">上传图片，一键移除背景</p>

      <div className="w-full max-w-md flex flex-col gap-5">

        {/* API 地址 */}
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1.5">
            Worker API 地址
          </label>
          <input
            type="text"
            placeholder="https://your-worker.xxx.workers.dev"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 transition-colors"
          />
        </div>

        {/* 上传区域 */}
        <div
          className={`
            relative border-2 border-dashed rounded-2xl overflow-hidden cursor-pointer
            transition-all duration-200 min-h-64 flex items-center justify-center
            ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white hover:border-gray-400'}
          `}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {originalImage ? (
            <img
              src={originalImage}
              alt="原图"
              className="max-w-full max-h-64 object-contain"
            />
          ) : (
            <div className="text-center text-gray-400 select-none">
              <div className="text-5xl mb-3">📤</div>
              <p className="font-medium text-gray-600">点击或拖拽上传图片</p>
              <p className="text-xs mt-1">支持 JPG、PNG、WebP</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
            ❌ {error}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <button
            onClick={handleRemoveBg}
            disabled={!originalImage || !apiUrl.trim() || loading}
            className={`
              flex-1 py-3 rounded-xl font-semibold text-white text-sm
              transition-all duration-200 flex items-center justify-center gap-2
              ${!originalImage || !apiUrl.trim() || loading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 active:scale-95'}
            `}
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                处理中...
              </>
            ) : (
              '✨ 移除背景'
            )}
          </button>

          {originalImage && (
            <button
              onClick={handleReset}
              className="px-5 py-3 bg-white border-2 border-gray-200 rounded-xl font-semibold text-gray-600 text-sm hover:border-gray-300 transition-colors"
            >
              重新上传
            </button>
          )}
        </div>

        {/* 结果区域 */}
        {resultImage && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center">
            <h2 className="text-base font-semibold text-gray-700 mb-3">✨ 结果预览</h2>

            {/* Checkerboard 背景展示透明图 */}
            <div className="relative inline-block mb-4 rounded-xl overflow-hidden">
              <div
                className="w-64 h-64 bg-checkerboard bg-[length:16px_16px] bg-[linear-gradient(45deg,#ccc_25%,transparent_25%,transparent_75%,#ccc_75%),linear-gradient(45deg,#ccc_25%,transparent_25%,transparent_75%,#ccc_75%)]"
                style={{ backgroundPosition: '0 0, 8px 8px' }}
              >
                <img
                  src={resultImage}
                  alt="结果图"
                  className="w-64 h-64 object-contain"
                />
              </div>
            </div>

            <button
              onClick={handleDownload}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 rounded-xl font-semibold text-white text-sm transition-all"
            >
              ⬇️ 下载 PNG
            </button>
          </div>
        )}

        {/* 底部说明 */}
        <div className="text-center text-xs text-gray-400 mt-2">
          图片仅在浏览器与 Worker 之间传输，不经过任何服务器
        </div>
      </div>
    </main>
  );
}
