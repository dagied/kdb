import { cookies } from 'next/headers';
import { TranslationProvider } from '@/hooks/useTranslation';
import './globals.css';  // Only here, not in components/Layout.jsx

export const metadata = {
  title: 'Kebele Management System',
  description: 'Manage kebele operations efficiently',
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('locale')?.value;
  const locale = ['en', 'am', 'om'].includes(localeCookie) ? localeCookie : 'en';

  return (
    <html lang={locale}>
      <body>
        <TranslationProvider>
          {children}
        </TranslationProvider>
      </body>
    </html>
  );
}