import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '图片背景移除',
  description: '使用 AI 移除图片背景',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
