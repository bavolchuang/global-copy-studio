import './globals.css';

export const metadata = {
  title: 'Global Social Copy Generator',
  description: 'Generate localized social media copy for cross-border e-commerce.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
