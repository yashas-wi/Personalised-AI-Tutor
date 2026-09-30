import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'AI Tutor — Learn AI Faster',
  description:
    'Adaptive AI-powered tutor for mastering machine learning, deep learning, transformers, and modern AI — personalised to your learning pace.',
  keywords: ['AI tutor', 'machine learning', 'deep learning', 'NLP', 'adaptive learning'],
  authors: [{ name: 'AI Tutor Team' }],
  openGraph: {
    title: 'AI Tutor — Learn AI Faster',
    description: 'Your personalised AI learning companion',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-900 text-white font-inter antialiased min-h-screen">
        <Navbar />
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
        <footer className="border-t border-white/5 py-8 text-center text-slate-500 text-sm">
          <p>
            Built with ❤️ for{' '}
            <span className="text-indigo-400 font-medium">Build Fast with AI Hackathon</span>
          </p>
        </footer>
      </body>
    </html>
  );
}
