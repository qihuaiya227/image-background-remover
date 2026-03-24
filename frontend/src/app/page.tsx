'use client';

import { useState, useRef } from 'react';

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiUrl, setApiUrl] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
      setResultImage(null);
      setError(null);
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
    if (!originalImage || !apiUrl.trim()) {
      setError('请先上传图片并填写 API 地址');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 将 base64 转换为 Blob
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
        throw new Error(errorText || `请求失败: ${response.status}`);
      }

      const resultBlob = await response.blob();
      const resultUrl = URL.createObjectURL(resultBlob);
      setResultImage(resultUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
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
    <main style={styles.main}>
      <h1 style={styles.title}>🪄 图片背景移除</h1>

      <div style={styles.apiSection}>
        <label style={styles.label}>API 地址：</label>
        <input
          type="text"
          placeholder="输入你的 Remove.bg Worker URL"
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          style={styles.apiInput}
        />
      </div>

      <div
        style={{
          ...styles.dropZone,
          ...(dragOver ? styles.dropZoneActive : {}),
        }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {!originalImage ? (
          <div style={styles.placeholder}>
            <div style={styles.icon}>📤</div>
            <p>点击或拖拽上传图片</p>
            <p style={styles.hint}>支持 JPG、PNG、WebP</p>
          </div>
        ) : (
          <img src={originalImage} alt="Original" style={styles.preview} />
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={styles.hiddenInput}
        />
      </div>

      {error && (
        <div style={styles.error}>
          ❌ {error}
        </div>
      )}

      <div style={styles.actions}>
        <button
          onClick={handleRemoveBg}
          disabled={!originalImage || !apiUrl.trim() || loading}
          style={{
            ...styles.button,
            ...(loading || !originalImage || !apiUrl.trim() ? styles.buttonDisabled : {}),
          }}
        >
          {loading ? '处理中...' : '移除背景'}
        </button>

        {originalImage && (
          <button onClick={handleReset} style={styles.buttonSecondary}>
            重新上传
          </button>
        )}
      </div>

      {resultImage && (
        <div style={styles.resultSection}>
          <h2 style={styles.subTitle}>✨ 结果</h2>
          <img src={resultImage} alt="Result" style={styles.resultPreview} />
          <button onClick={handleDownload} style={styles.downloadButton}>
            ⬇️ 下载 PNG
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  main: {
    minHeight: '100vh',
    padding: '40px 20px',
    background: '#f5f5f5',
    fontFamily: 'system-ui, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '24px',
    color: '#333',
  },
  apiSection: {
    width: '100%',
    maxWidth: '480px',
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '6px',
    color: '#555',
  },
  apiInput: {
    width: '100%',
    padding: '10px 14px',
    fontSize: '14px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  dropZone: {
    width: '100%',
    maxWidth: '480px',
    height: '320px',
    border: '3px dashed #ccc',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: '#fff',
    overflow: 'hidden',
  },
  dropZoneActive: {
    borderColor: '#0070f3',
    background: '#f0f7ff',
  },
  placeholder: {
    textAlign: 'center',
    color: '#888',
    userSelect: 'none',
  },
  icon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  hint: {
    fontSize: '12px',
    marginTop: '6px',
  },
  preview: {
    maxWidth: '100%',
    maxHeight: '320px',
    objectFit: 'contain',
  },
  hiddenInput: {
    display: 'none',
  },
  error: {
    marginTop: '16px',
    padding: '12px 16px',
    background: '#fee',
    color: '#c00',
    borderRadius: '8px',
    fontSize: '14px',
    maxWidth: '480px',
    width: '100%',
    boxSizing: 'border-box',
  },
  actions: {
    marginTop: '20px',
    display: 'flex',
    gap: '12px',
  },
  button: {
    padding: '12px 32px',
    fontSize: '16px',
    fontWeight: '600',
    background: '#0070f3',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  buttonDisabled: {
    background: '#ccc',
    cursor: 'not-allowed',
  },
  buttonSecondary: {
    padding: '12px 24px',
    fontSize: '16px',
    background: '#fff',
    color: '#666',
    border: '2px solid #ddd',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  resultSection: {
    marginTop: '32px',
    textAlign: 'center',
    width: '100%',
    maxWidth: '480px',
  },
  subTitle: {
    fontSize: '20px',
    marginBottom: '16px',
    color: '#333',
  },
  resultPreview: {
    maxWidth: '100%',
    maxHeight: '400px',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
  },
  downloadButton: {
    marginTop: '16px',
    padding: '12px 32px',
    fontSize: '16px',
    fontWeight: '600',
    background: '#10b759',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};
