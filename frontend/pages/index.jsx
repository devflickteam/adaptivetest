import Head from "next/head";
import { useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useApiClient } from "../lib/api";
import toast from "react-hot-toast";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { startScan } = useApiClient();

  // ✅ URL sanitizer
  function normalizeUrl(input) {
    let clean = input.trim();

    // remove duplicate protocols like http://https://
    clean = clean.replace(/^(https?:\/\/)+/i, "https://");

    // if user typed only domain, prepend https://
    if (!/^https?:\/\//i.test(clean)) {
      clean = "https://" + clean;
    }

    return clean;
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!url.trim()) return;

    const target = normalizeUrl(url);

    setLoading(true);
    try {
      const { ok, data } = await startScan(target);

      if (!ok) throw new Error("Scan failed");

      if (data?.report) {
        localStorage.setItem(
          "adaptivetest:lastReport",
          JSON.stringify(data)
        );
        toast.success("Report ready! Redirecting…");
        router.push("/result/local");
        return;
      }
      if (data?.scan_id) {
        toast.success("Scan started successfully!");
        router.push(`/scanning/${encodeURIComponent(data.scan_id)}`);
        return;
      }
      router.push("/not-enabled");
    } catch (err) {
      console.error(err);
      toast.error("Unable to start scan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#132A13] text-white">
      <Head>
        <title>AdaptiveTest AI – Accessibility Scanner</title>
        <meta
          name="description"
          content="Run automated accessibility scans for your website with AdaptiveTest AI. Generate instant reports and stay WCAG 2.1 compliant."
        />
      </Head>

      <Navbar />

      {/* HERO */}
      <section className="relative max-w-[1100px] mx-auto pt-[160px] md:pt-[180px] px-6 text-center">
        <h1 className="font-amiri text-[100px] leading-tight pt-[20px]">
          AdaptiveTest AI
        </h1>

        {/* URL + button inline */}
        <form
          onSubmit={onSubmit}
          className="mt-8 flex items-stretch justify-center gap-3"
          aria-label="Start accessibility scan"
        >
          <input
            type="text" // ✅ no browser validation block
            required
            placeholder="https://yourwebsite.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-[340px] md:w-[440px] h-11 rounded-md border border-white/40 bg-transparent px-4 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/60"
          />
          <button
            type="submit"
            disabled={loading}
            className="h-11 px-6 rounded-md bg-white text-[#132A13] font-semibold hover:opacity-95 disabled:opacity-70"
          >
            {loading ? "Starting…" : "Scan Now"}
          </button>
        </form>
      </section>

      {/* TWO-COLUMN CONTENT */}
      <section className="max-w-[1100px] mx-auto px-6 mt-16 md:mt-24 grid md:grid-cols-2 gap-10">
        <div>
          <h2 className="font-amiri text-[28px] leading-[1.3] md:text-[32px]">
            You&apos;ve got violations!<br />
            Tackle them with automation.
          </h2>
          <a
            href="https://www.adaptiveatelier.com/adaptivewiz/"
            className="inline-flex items-center gap-2 mt-8 font-amiri text-xl text-stone-300 hover:text-white"
          >
            Get AdaptiveWiz
            <span aria-hidden>→</span>
          </a>
        </div>

        <ul className="space-y-2 text-stone-200 font-amiri text-lg leading-relaxed list-disc pl-6">
          <li>Continuous monitoring, alerting &amp; reporting</li>
          <li>Seamless fixes 24/7</li>
          <li>Boosted site usability &amp; performance</li>
          <li>WCAG 2.1 &amp; 2.2 AA standards</li>
        </ul>
      </section>

      <div className="pt-[200px]">
        <Footer />
      </div>
    </div>
  );
}
