// frontend/js/scanResults.js

async function fetchScanResults() {
  const response = await fetch("http://localhost:8000/api/v1/scan/results");
  const results = await response.json();

  const container = document.getElementById("results-container");
  container.innerHTML = "";

  results.forEach(r => {
    const card = `
      <div class="result-card" style="
        border: 1px solid #ddd; 
        border-radius: 8px; 
        padding: 16px; 
        margin-bottom: 12px;
        background: #fff;
        box-shadow: 0px 2px 6px rgba(0,0,0,0.05);
      ">
        <h3 style="margin: 0 0 8px 0; color: #000;">${r.file_name}</h3>
        <p style="margin: 4px 0; color: gray;">Status: ${r.status}</p>
        <p style="margin: 4px 0; color: gray;">Details: ${r.details || "N/A"}</p>
        <p style="margin: 4px 0; color: gray;">Created: ${new Date(r.created_at).toLocaleString()}</p>
      </div>
    `;
    container.innerHTML += card;
  });

  // Handle "Download All" button visibility
  const downloadAllContainer = document.getElementById("download-all-container");
  if (results.length > 0) {
    downloadAllContainer.innerHTML = `
      <button onclick="window.open('http://localhost:8000/api/v1/scan/results/download', '_blank')" 
        style="
          background-color: #132A13; 
          color: #fff; 
          border: none; 
          padding: 10px 18px; 
          border-radius: 6px; 
          font-size: 14px; 
          cursor: pointer;
          margin-top: 16px;
        ">
        Download All Results (PDF)
      </button>
    `;
  } else {
    downloadAllContainer.innerHTML = ""; // hide if no results
  }
}

// Run fetch once page loads
document.addEventListener("DOMContentLoaded", fetchScanResults);
