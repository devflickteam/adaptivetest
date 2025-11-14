import { useEffect, useState } from "react";
import { useApiClient } from "../lib/api";
import toast from "react-hot-toast";

export default function ScanResults() {
  const { getAllResults, downloadAllResultsPdf } = useApiClient();
  const [latestReport, setLatestReport] = useState(null);
  const [results, setResults] = useState([]);

  useEffect(() => {
    // Try load latest report from localStorage first
    try {
      const stored = localStorage.getItem("adaptivetest:lastReport");
      if (stored) {
        setLatestReport(JSON.parse(stored));
      }
    } catch {
      // ignore broken JSON
    }

    // Always fetch from API for full history
    async function fetchResults() {
      const { ok, data } = await getAllResults();
      if (ok && data) {
        setResults(data);
      } else {
        setResults([]);
        toast.error("Failed to load scan results");
      }
    }

    fetchResults();
  }, [getAllResults]);

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ color: "gray" }}>Scan Results</h2>

      {/* Latest Report (from localStorage) */}
      {latestReport && (
        <div
          style={{
            border: "2px solid #4CAF50",
            borderRadius: "8px",
            padding: "15px",
            marginBottom: "25px",
            backgroundColor: "#f6fff6",
          }}
        >
          <h3 style={{ color: "#2e7d32" }}>Most Recent Report</h3>
          <p>
            <strong>URL:</strong> {latestReport.url}
          </p>
          <p>
            <strong>Total Issues:</strong>{" "}
            {latestReport.issues?.length ?? "N/A"}
          </p>
          <p>
            <strong>Generated At:</strong>{" "}
            {new Date(latestReport.generated_at).toLocaleString()}
          </p>
        </div>
      )}

      {/* Full History (from DB/API) */}
      <div>
        {results.length === 0 ? (
          <p>No scan results yet.</p>
        ) : (
          results.map((r) => (
            <div
              key={r.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "15px",
                marginBottom: "15px",
                backgroundColor: "white",
              }}
            >
              <h3 style={{ color: "gray" }}>{r.file_name || "Untitled Scan"}</h3>
              <p>Status: {r.status}</p>
              <p>Details: {r.details || "N/A"}</p>
              <p>Scanned At: {new Date(r.created_at).toLocaleString()}</p>
            </div>
          ))
        )}
      </div>

      {/* Download All */}
      {results.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <button
            style={{
              backgroundColor: "#132A13",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "5px",
              cursor: "pointer",
            }}
            onClick={downloadAllResultsPdf}
          >
            Download All Results (PDF)
          </button>
        </div>
      )}
    </div>
  );
}
