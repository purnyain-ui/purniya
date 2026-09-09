import type { Metadata } from 'next';
import './globals.css';
import { StoreProvider } from '../context/StoreContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SearchModal from '../components/SearchModal';
import Toast from '../components/Toast';
import AuthModal from '../components/AuthModal';
   import ResetPasswordModal from '../components/ResetPasswordModal';

export const metadata: Metadata = {
  title: 'Purnya.in | Official Multi-Category Premium Lifestyle E-Commerce',
  description:
    'Discover Purnya.in — a unified lifestyle destination featuring handcrafted Jewellery & Accessories, artisanal Candle & Home Fragrances, Home Décor, Organic Wellness, and curated Gifts.',
  keywords: [
    'Purnya',
    'Purnya.in',
    'Jewellery',
    'Sand Wax Candle',
    'Home Decor',
    'Organic Wellness',
    'Luxury Gifts',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#0B241C]">
         <ResetPasswordModal />
        <StoreProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <SearchModal />
          <Toast />
          <AuthModal />
        </StoreProvider>
      </body>
    </html>
  );
}
