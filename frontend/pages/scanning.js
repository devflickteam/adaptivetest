// pages/scanning.js - NEW FILE FOR AUTO-SCAN
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function ScanningRedirect() {
  const router = useRouter();

  useEffect(() => {
    const handleAutoScan = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const scanUrl = urlParams.get('scan_url');
      
      if (scanUrl) {
        try {
          // Start the scan via API
          const response = await fetch('https://adaptivetest-backend-b0d1ae1cfaec.herokuapp.com/api/v1/scan/start', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: scanUrl }),
          });

          if (response.ok) {
            const data = await response.json();
            
            if (data.scan_id) {
              // Redirect to the dynamic scanning page with the scan ID
              router.replace(`/scanning/${data.scan_id}?scan_url=${encodeURIComponent(scanUrl)}`);
            } else {
              throw new Error('No scan ID received');
            }
          } else {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to start scan');
          }
        } catch (error) {
          console.error('Auto-scan failed:', error);
          // Redirect to home page with error
          router.replace(`/?error=${encodeURIComponent(error.message)}`);
        }
      } else {
        // No scan_url parameter, redirect to home
        router.replace('/');
      }
    };

    handleAutoScan();
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Head>
        <title>Starting Scan – AdaptiveTest AI</title>
      </Head>
      
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">🔄 Starting Accessibility Scan</h1>
        <p className="text-gray-600">Please wait while we initialize your scan...</p>
        <div className="mt-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        </div>
      </div>
    </div>
  );
}