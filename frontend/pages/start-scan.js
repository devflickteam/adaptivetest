// pages/start-scan.js - NEW FILE FOR AUTO-SCAN
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useApiClient } from "../lib/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Lottie from "lottie-react";
import scanningAnimation from "../public/assets/lottie/scanning.json";

export default function StartScanPage() {
  const router = useRouter();
  const { startScan } = useApiClient();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleAutoScan = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const scanUrl = urlParams.get('scan_url');
      
      if (!scanUrl) {
        setStatus('error');
        setError('No URL provided');
        setTimeout(() => router.push('/'), 2000);
        return;
      }

      try {
        setStatus('starting');
        const decodedUrl = decodeURIComponent(scanUrl);
        
        console.log('Starting auto-scan for:', decodedUrl);
        
        const { ok, data } = await startScan(decodedUrl);
        
        if (ok && data.scan_id) {
          setStatus('redirecting');
          // Redirect to the scanning page with the scan ID
          setTimeout(() => {
            router.push(`/scanning/${data.scan_id}?scan_url=${encodeURIComponent(decodedUrl)}`);
          }, 1000);
        } else {
          throw new Error(data?.detail || 'Failed to start scan');
        }
      } catch (error) {
        console.error('Auto-scan failed:', error);
        setStatus('error');
        setError(error.message);
        setTimeout(() => router.push('/'), 3000);
      }
    };

    handleAutoScan();
  }, [router, startScan]);

  // Delete the pages/scanning.js file you created
  // Remove pages/scanning.js if it exists

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <Head>
        <title>Starting Scan – AdaptiveTest AI</title>
      </Head>

      <Navbar />

      {/* Hero Section */}
      <div className="relative bg-[#132A13] text-white py-20 overflow-hidden">
        <div className="absolute w-[1386px] h-[1386px] left-[-200px] top-[-131px] border border-white/30 rounded-full" />
        <div className="absolute w-[1219px] h-[1219px] left-[-150px] top-[-47px] border border-white rounded-full" />
        
        <div className="relative max-w-4xl mx-auto text-center px-4">
          <h1 className="font-amiri text-6xl md:text-7xl lg:text-8xl mb-8 leading-tight">
            AdaptiveTest AI
          </h1>
          
          <div className="inline-flex items-center border border-white rounded-lg px-6 py-3 mb-8">
            <span className="font-bold text-sm">
              {status === 'starting' ? '🔄 Starting scan...' : 
               status === 'redirecting' ? '✅ Scan started! Redirecting...' :
               status === 'error' ? '❌ Error: ' + error : 
               'Loading...'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-white rounded-2xl shadow-[3px_3px_20px_rgba(0,0,0,0.20)] p-8 mb-8">
            <h2 className="font-amiri text-5xl md:text-6xl text-black mb-4">
              {status === 'starting' ? 'Starting Your Scan' :
               status === 'redirecting' ? 'Scan Started!' :
               status === 'error' ? 'Scan Failed' :
               'Preparing Scan'}
            </h2>
            
            <p className="text-xl text-gray-600 mb-8">
              {status === 'starting' ? 'Initializing accessibility scan...' :
               status === 'redirecting' ? 'Redirecting to scan progress...' :
               status === 'error' ? error :
               'Please wait...'}
            </p>

            {/* Loading Animation */}
            <div className="flex justify-center">
              <div className="w-48 h-48">
                <Lottie animationData={scanningAnimation} loop={status !== 'error'} />
              </div>
            </div>

            {/* Progress Bar */}
            {(status === 'starting' || status === 'redirecting') && (
              <div className="max-w-2xl mx-auto mt-8">
                <div className="bg-gradient-to-r from-[#F6EDEC] to-white h-8 rounded-lg mb-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#132A13] to-[#2d5a2d] h-full rounded-lg transition-all duration-1000 ease-out"
                    style={{ width: status === 'redirecting' ? '100%' : '60%' }}
                  />
                </div>
                <p className="text-center text-lg font-semibold">
                  {status === 'redirecting' ? '100% Complete' : '60% Complete'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}