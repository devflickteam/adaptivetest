#!/usr/bin/env node
import pa11y from 'pa11y';

let url = process.argv[2];

if (!url) {
  console.error("❌ Please provide a URL to scan.");
  process.exit(1);
}

// Add https:// if missing
if (!/^https?:\/\//i.test(url)) {
  url = 'https://' + url;
}

async function runOnce(u) {
  return await pa11y(u, {
    standard: 'WCAG2AA',
    runners: ['axe'],
    timeout: 60000
  });
}

(async () => {
  try {
    const results = await runOnce(url);
    console.log(JSON.stringify(results, null, 2));
  } catch (err) {
    // Retry with http if https blocked
    try {
      const httpUrl = url.replace(/^https:\/\//i, 'http://');
      const results = await runOnce(httpUrl);
      console.log(JSON.stringify(results, null, 2));
    } catch (err2) {
      console.error("❌ Error running Pa11y on both HTTPS and HTTP:", err2?.message || err2);
      process.exit(1);
    }
  }
})();
