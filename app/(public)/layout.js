import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingContact from '@/components/FloatingContact';
import { getAllSettings } from '@/lib/settings';

export default function PublicLayout({ children }) {
  const s = getAllSettings();
  return (
    <>
      {/* @ts-expect-error Async Server Component */}
      <Navbar />
      <main className="min-h-[60vh]">{children}</main>
      <FloatingContact
        line={s.social_line || ''}
        whatsapp={s.social_whatsapp || ''}
        phone={s.contact_phone || ''}
      />
      <Footer />
    </>
  );
}
