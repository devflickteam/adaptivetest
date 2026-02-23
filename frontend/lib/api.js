// lib/api.js
import { useApi } from '../context/ApiContext';
import { handleApiError } from './errorHandler';
import toast from 'react-hot-toast';

export function useApiClient() {
  const { apiBaseUrl } = useApi();
  // UPDATED: Changed to new backend URL
  const baseUrl = apiBaseUrl || process.env.NEXT_PUBLIC_API_URL || "https://adaptivetest-99a9087d9ed9.herokuapp.com/api/v1";

  // ADD THIS NEW FUNCTION: Get scan results by ID
  async function getScanResults(scanId) {
    if (!scanId) return { ok: false, data: null };
    try {
      console.log('📡 Fetching scan results for ID:', scanId);
      const res = await fetch(`${baseUrl}/scan/${scanId}/results`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      return { ok: res.ok, data };
    } catch (err) {
      handleApiError('Failed to fetch scan results', err);
      return { 
        ok: false, 
        data: { 
          detail: err.message 
        } 
      };
    }
  }

  // Start a new scan
  async function startScan(url) {
    try {
      console.log('Starting scan for URL:', url);
      
      const res = await fetch(`${baseUrl}/scan/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: `HTTP error! status: ${res.status}` }));
        throw new Error(errorData.detail || `HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Scan started successfully:', data);
      return { ok: res.ok, data };
    } catch (err) {
      console.error('Scan start error:', err);
      handleApiError('Failed to start scan', err);
      return { 
        ok: false, 
        data: { 
          detail: err.message || 'Failed to start scan',
          scan_id: null 
        } 
      };
    }
  }

  // Check scan status
  async function getScanStatus(scanId) {
    if (!scanId) return { ok: false, data: null };
    try {
      const res = await fetch(`${baseUrl}/scan/${scanId}/status`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      return { ok: res.ok, data };
    } catch (err) {
      handleApiError('Failed to fetch scan status', err);
      return { 
        ok: false, 
        data: { 
          status: 'error',
          detail: err.message 
        } 
      };
    }
  }

  // Get report
  async function getReport(scanId) {
    if (!scanId) return { ok: false, data: null };
    try {
      const res = await fetch(`${baseUrl}/scan/${scanId}/report`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      return { ok: res.ok, data };
    } catch (err) {
      handleApiError('Failed to fetch report', err);
      return { 
        ok: false, 
        data: { 
          detail: err.message 
        } 
      };
    }
  }

  // Download PDF report
  async function downloadPdfReport(scanId) {
    if (!scanId) return { ok: false };
    try {
      const res = await fetch(`${baseUrl}/scan/${scanId}/report/pdf`);

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(
          `Download failed (${res.status}): ${errorText || 'Unknown error'}`
        );
      }

      const blob = await res.blob();

      // Default filename
      let filename = `report-${scanId}.pdf`;

      // Infer filename from cached report URL if available
      try {
        const lastReport = JSON.parse(
          localStorage.getItem('adaptivetest:lastReport') || '{}'
        );
        if (lastReport?.url) {
          const hostname = new URL(lastReport.url).hostname.replace(/\W+/g, '_');
          filename = `report-${hostname}.pdf`;
        }
      } catch {
        // ignore parsing error
      }

      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`📄 Report downloaded as ${filename}`);
      return { ok: true };
    } catch (err) {
      handleApiError('Failed to download report', err);
      return { ok: false };
    }
  }

  // Get all scan results
  async function getAllResults() {
    try {
      const res = await fetch(`${baseUrl}/scan/results`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      return { ok: res.ok, data };
    } catch (err) {
      handleApiError("Failed to fetch scan results", err);
      return { ok: false, data: [] };
    }
  }

  // Download all scan results as one PDF
  async function downloadAllResultsPdf() {
    try {
      const res = await fetch(`${baseUrl}/scan/results/download`);

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(
          `Download failed (${res.status}): ${errorText || "Unknown error"}`
        );
      }

      const blob = await res.blob();
      const filename = `all-scan-results-${Date.now()}.pdf`;

      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`📄 All results downloaded as ${filename}`);
      return { ok: true };
    } catch (err) {
      handleApiError("Failed to download all scan results", err);
      return { ok: false };
    }
  }

  // NEW: Validate URL before scanning (optional helper function)
  async function validateUrl(url) {
    try {
      // Basic client-side validation
      const normalizedUrl = normalizeUrl(url);
      const urlObj = new URL(normalizedUrl);
      
      return {
        valid: true,
        normalizedUrl: normalizedUrl,
        message: 'URL is valid'
      };
    } catch (error) {
      return {
        valid: false,
        normalizedUrl: null,
        message: 'Please enter a valid website URL'
      };
    }
  }

  // Helper function to normalize URLs
  function normalizeUrl(url) {
    let normalizedUrl = url.trim();
    
    // Remove any existing protocol to avoid duplication
    normalizedUrl = normalizedUrl.replace(/^(https?:\/\/)/, '');
    
    // Add https:// protocol if no protocol is present
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    
    return normalizedUrl;
  }

  return { 
    startScan, 
    getScanStatus, 
    getReport, 
    getScanResults, // NEW: Added this function
    downloadPdfReport, 
    getAllResults, 
    downloadAllResultsPdf,
    validateUrl,
    normalizeUrl
  };
}