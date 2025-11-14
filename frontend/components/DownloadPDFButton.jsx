// components/DownloadPDFButton.jsx - FIXED VERSION
import { useState, useEffect } from 'react';
import { useApiClient } from '../lib/api'; // Import the hook

export default function DownloadPDFButton({ scanId: propScanId, report, className = '' }) {
  const [scanId, setScanId] = useState(propScanId || '');
  const [siteUrl, setSiteUrl] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Use the API client hook
  const { downloadPdfReport } = useApiClient();

  useEffect(() => {
    console.log('DownloadPDFButton mounted - propScanId:', propScanId, 'report:', report);
    
    // Use prop scanId first, then try localStorage, then report prop
    if (propScanId) {
      setScanId(propScanId);
      console.log('Using propScanId:', propScanId);
    } else if (report?.scan_id) {
      setScanId(report.scan_id);
      console.log('Using report.scan_id:', report.scan_id);
    } else {
      try {
        const stored = localStorage.getItem('adaptivetest:lastReport');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.scan_id) {
            setScanId(parsed.scan_id);
            console.log('Using localStorage scan_id:', parsed.scan_id);
          }
          if (parsed?.url) {
            setSiteUrl(parsed.url);
          }
        }
      } catch (err) {
        console.error('Failed to load scan details from localStorage', err);
      }
    }

    // Also use the report prop if provided
    if (report) {
      if (report.scan_id) {
        setScanId(report.scan_id);
        console.log('Using report.scan_id:', report.scan_id);
      }
      if (report.url) setSiteUrl(report.url);
    }
  }, [propScanId, report]);

  async function handleDownload() {
    console.log('🔄 Download button clicked');
    console.log('📋 Scan ID:', scanId);
    console.log('🌐 Site URL:', siteUrl);
    console.log('📊 Report data:', report);
    
    if (!scanId) {
      alert('❌ No scan ID available. Please complete a scan first.');
      return;
    }

    setLoading(true);
    try {
      console.log('🚀 Calling downloadPdfReport with scanId:', scanId);
      const result = await downloadPdfReport(scanId);
      
      if (result.ok) {
        console.log('✅ PDF download completed successfully');
      } else {
        console.error('❌ PDF download failed in API');
        alert('❌ PDF download failed. Please try again.');
      }
    } catch (err) {
      console.error('💥 Download error:', err);
      alert('❌ Download failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading || !scanId}
      className={`${className} ${
        loading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 transition-opacity'
      }`}
    >
      {loading ? '⏳ Downloading PDF...' : '📄 Download PDF Report'}
    </button>
  );
}