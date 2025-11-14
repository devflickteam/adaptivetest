
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function NotEnabled() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#132A13' }}>
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <img src="/assets/images/site-not-enabled.svg" alt="Site Not Enabled" className="mb-6 max-w-xs rounded-2xl shadow-soft" />
        <h2 className="font-amiri text-3xl text-white mb-2">This site is not scan-enabled.</h2>
        <p className="text-white/80 max-w-md">We couldn’t scan that URL right now. Please check the website address or try again later.</p>
      </main>
      <Footer />
    </div>
  );
}
