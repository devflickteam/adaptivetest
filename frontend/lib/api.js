// lib/api.js
import { useApi } from '../context/ApiContext';
import { handleApiError } from './errorHandler';
import toast from 'react-hot-toast';

export function useApiClient() {
  const { apiBaseUrl } = useApi();
  // Add /api/v1 to the base URL
  const baseUrl = apiBaseUrl || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

  // Start a new scan - FIXED ENDPOINT
  async function startScan(url) {
    try {
      const res = await fetch(`${baseUrl}/scan/start`, {  // ← CHANGED FROM /scan TO /scan/start
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      return { ok: res.ok, data };
    } catch (err) {
      handleApiError('Failed to start scan', err);
      return { ok: false, data: null };
    }
  }

  // Check scan status - UPDATED ENDPOINT
  async function getScanStatus(scanId) {
    if (!scanId) return { ok: false, data: null };
    try {
      const res = await fetch(`${baseUrl}/scan/${scanId}/status`);  // ← Now under /api/v1
      const data = await res.json();
      return { ok: res.ok, data };
    } catch (err) {
      handleApiError('Failed to fetch scan status', err);
      return { ok: false, data: null };
    }
  }

  // Get report - UPDATED ENDPOINT
  async function getReport(scanId) {
    if (!scanId) return { ok: false, data: null };
    try {
      const res = await fetch(`${baseUrl}/scan/${scanId}/report`);  // ← Now under /api/v1
      const data = await res.json();
      return { ok: res.ok, data };
    } catch (err) {
      handleApiError('Failed to fetch report', err);
      return { ok: false, data: null };
    }
  }

  // Download PDF report - UPDATED ENDPOINT
  async function downloadPdfReport(scanId) {
    if (!scanId) return { ok: false };
    try {
      const res = await fetch(`${baseUrl}/scan/${scanId}/report/pdf`);  // ← Now under /api/v1

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

  // Get all scan results - UPDATED ENDPOINT
  async function getAllResults() {
    try {
      const res = await fetch(`${baseUrl}/scan/results`);  // ← Now under /api/v1
      const data = await res.json();
      return { ok: res.ok, data };
    } catch (err) {
      handleApiError("Failed to fetch scan results", err);
      return { ok: false, data: [] };
    }
  }

  // Download all scan results as one PDF - UPDATED ENDPOINT
  async function downloadAllResultsPdf() {
    try {
      const res = await fetch(`${baseUrl}/scan/results/download`);  // ← Now under /api/v1

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

  return { 
    startScan, 
    getScanStatus, 
    getReport, 
    downloadPdfReport, 
    getAllResults, 
    downloadAllResultsPdf 
  };
}