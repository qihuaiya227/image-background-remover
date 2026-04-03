import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '🪄 图片背景移除',
  description: '使用 AI 移除图片背景，一键生成透明底图片',
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
