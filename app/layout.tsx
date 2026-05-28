import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import ThemeProvider from '@/components/theme-provider';
import { Heart } from 'lucide-react';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'UPSC Prelims GS + CSAT Score Analyzer Portal',
  description: 'Instantly attempt the brand-new 2026 UPSC Prelims GS and CSAT papers online, get calculated scores under official keys, and receive deep visual topic analytics.',
  keywords: 'UPSC Prelims 2026, UPSC Answer Key, Score Analyzer, CSAT Qualifier, UPSC Mock Test, Vajiram Drishti Keys',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased`}>
        <ThemeProvider>
          {/* Dynamic Background Mesh Gradients */}
          <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none opacity-45 dark:opacity-25 transition-opacity">
            <div className="absolute top-[-20%] left-[-10%] w-[60%] aspect-square rounded-full bg-radial from-violet-400/30 dark:from-violet-900/25 to-transparent blur-3xl animate-pulse-slow" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] aspect-square rounded-full bg-radial from-emerald-400/20 dark:from-emerald-900/20 to-transparent blur-3xl" style={{ animationDelay: '3s' }} />
          </div>

          <div className="flex flex-col min-h-screen">
            <main className="flex-1 w-full relative z-10">
              {children}
            </main>
            
            {/* Premium Creator Footer */}
            <footer className="w-full py-6 mt-12 border-t border-border/40 bg-card/10 backdrop-blur-md relative z-10">
              <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5 font-medium">
                  Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse shrink-0" /> by <span className="text-foreground font-semibold">Aditya Sharma</span>
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 sm:gap-5 justify-center">
                  <span className="font-medium text-foreground/80 text-center sm:text-left">If you like this project, follow me on:</span>
                  <div className="flex items-center gap-4">
                    <a 
                      href="https://x.com/AdityaBuilds_Z" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 hover:text-primary transition-colors font-semibold text-foreground/90"
                    >
                      <svg 
                        viewBox="0 0 24 24" 
                        fill="currentColor" 
                        className="w-3.5 h-3.5 shrink-0 text-foreground dark:text-foreground"
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      Twitter (X)
                    </a>
                    <span className="text-muted-foreground/30 font-light">|</span>
                    <a 
                      href="https://github.com/Aditya-54/Upsc_score_analyzer" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors font-semibold text-foreground/90"
                    >
                      <svg 
                        viewBox="0 0 24 24" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        fill="none" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="w-3.5 h-3.5 shrink-0 text-foreground dark:text-foreground"
                      >
                        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                        <path d="M9 18c-4.51 2-5-2-7-2" />
                      </svg>
                      GitHub (Star & Follow)
                    </a>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
