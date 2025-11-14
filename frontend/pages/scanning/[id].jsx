// pages/scanning/[id].jsx - UPDATED TO MATCH FIGMA
import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useApiClient } from "../../lib/api";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Lottie from "lottie-react";
import scanningAnimation from "../../public/assets/lottie/scanning.json";
import toast from "react-hot-toast";

export default function ScanningPage() {
  const router = useRouter();
  const { id } = router.query;
  const { getScanStatus, getReport } = useApiClient();

  const [status, setStatus] = useState("pending");
  const [phase, setPhase] = useState("crawling");
  const [progress, setProgress] = useState(10);
  const [scanUrl, setScanUrl] = useState("");

  // Real-time scanning categories with dynamic progress
  const [scanningCategories, setScanningCategories] = useState([
    { name: "Evaluating Clickables...", progress: 0, completed: false },
    { name: "Evaluating Titles...", progress: 0, completed: false },
    { name: "Evaluating Orientation...", progress: 0, completed: false },
    { name: "Evaluating Menus...", progress: 0, completed: false },
    { name: "Evaluating Graphics...", progress: 0, completed: false },
    { name: "Evaluating Forms...", progress: 0, completed: false },
    { name: "Evaluating Document...", progress: 0, completed: false },
    { name: "Evaluating Readability...", progress: 0, completed: false },
    { name: "Evaluating Carousels...", progress: 0, completed: false },
    { name: "Evaluating Tables...", progress: 0, completed: false },
  ]);

  useEffect(() => {
    if (!id) return;

    let interval = setInterval(async () => {
      try {
        const { ok, data } = await getScanStatus(id);
        if (!ok || !data) return;

        setStatus(data.status || "pending");
        if (data.phase) setPhase(data.phase);
        if (data.url) setScanUrl(data.url);

        // Update scanning categories based on phase
        const updatedCategories = [...scanningCategories];
        
        if (data.phase === "crawling") {
          updatedCategories[0].progress = 40; // Clickables
          updatedCategories[1].progress = 20; // Titles
        } else if (data.phase === "analyzing") {
          updatedCategories[0].progress = 100; // Clickables - done
          updatedCategories[1].progress = 100; // Titles - done
          updatedCategories[2].progress = 80;  // Orientation
          updatedCategories[3].progress = 60;  // Menus
          updatedCategories[4].progress = 70;  // Graphics
        } else if (data.phase === "reporting") {
          // All categories complete during reporting
          updatedCategories.forEach((cat, index) => {
            updatedCategories[index].progress = 100;
            updatedCategories[index].completed = true;
          });
        }

        setScanningCategories(updatedCategories);

        // Map phases to overall progress
        const progressMap = { crawling: 33, analyzing: 66, reporting: 90 };

        if (data.status === "completed") {
          setProgress(100);
          clearInterval(interval);

          // Fetch full report and save locally
          const { ok: okReport, data: reportData } = await getReport(id);
          if (okReport && reportData) {
            localStorage.setItem(
              "adaptivetest:lastReport",
              JSON.stringify(reportData)
            );
          }
          toast.success("✅ Scan completed! Redirecting to your report…");
          setTimeout(() => router.push("/result/local"), 1500);
        } else if (data.status === "failed") {
          clearInterval(interval);
          toast.error("❌ Scan failed. Please try again.");
        } else {
          // Either use mapped progress or keep slowly increasing
          setProgress((prev) =>
            progressMap[data.phase]
              ? progressMap[data.phase]
              : Math.min(prev + 5, 95)
          );
        }
      } catch {
        // ignore transient errors
      }
    }, 5000); // poll every 5s

    return () => clearInterval(interval);
  }, [id, getScanStatus, getReport, router]);

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <Head>
        <title>Scanning in Progress – AdaptiveTest AI</title>
        <meta
          name="description"
          content="Your website scan is in progress. AdaptiveTest AI is crawling, analyzing, and generating your accessibility report."
        />
      </Head>

      <Navbar />

      {/* Hero Section with Background - EXACTLY LIKE FIGMA */}
      <div className="relative bg-[#132A13] text-white py-20 overflow-hidden">
        {/* Circular Background Elements */}
        <div className="absolute w-[1386px] h-[1386px] left-[-200px] top-[-131px] border border-white/30 rounded-full" />
        <div className="absolute w-[1219px] h-[1219px] left-[-150px] top-[-47px] border border-white rounded-full" />
        
        <div className="relative max-w-4xl mx-auto text-center px-4">
          <h1 className="font-amiri text-6xl md:text-7xl lg:text-8xl mb-8 leading-tight">
            AdaptiveTest AI
          </h1>
          
          {scanUrl && (
            <div className="inline-flex items-center border border-white rounded-lg px-6 py-3 mb-8">
              <span className="font-bold text-sm">{scanUrl}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area - White Background */}
      <div className="flex-1 bg-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          {/* Scanning Header Card */}
          <div className="bg-white rounded-2xl shadow-[3px_3px_20px_rgba(0,0,0,0.20)] p-8 mb-8">
            <div className="text-center mb-8">
              <h2 className="font-amiri text-5xl md:text-6xl text-black mb-4">
                Scanning your website...
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Testing your website for accessibility requirements with recommendations on where to adapt
              </p>
            </div>

            {/* Main Progress Bar */}
            <div className="max-w-4xl mx-auto mb-8">
              <div className="bg-gradient-to-r from-[#F6EDEC] to-white h-16 rounded-lg mb-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#132A13] to-[#2d5a2d] h-full rounded-lg transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-center text-2xl font-semibold">{progress}% Complete</p>
            </div>

            {/* Scanning Animation */}
            <div className="flex justify-center">
              <div className="w-48 h-48">
                <Lottie animationData={scanningAnimation} loop />
              </div>
            </div>
          </div>

          {/* REAL-TIME SCANNING CATEGORIES - EXACTLY LIKE FIGMA */}
          <div className="space-y-8">
            {scanningCategories.map((category, index) => (
              <div 
                key={index}
                className="bg-white rounded-2xl shadow-[3px_3px_20px_rgba(0,0,0,0.20)] p-8 relative"
              >
                {/* Category Header */}
                <h3 className="font-amiri text-3xl mb-6 text-black">
                  {category.name}
                </h3>
                
                {/* Progress Bars - EXACT FIGMA STYLE */}
                <div className="space-y-4">
                  {/* Main Progress Bar */}
                  <div className="mb-4">
                    <div className="bg-gradient-to-r from-[#F6EDEC] to-white h-16 rounded-lg overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#132A13] to-[#2d5a2d] h-full rounded-lg transition-all duration-1000 ease-out"
                        style={{ width: `${category.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Secondary Progress Bar (if needed) */}
                  {category.progress > 0 && category.progress < 100 && (
                    <div className="max-w-md">
                      <div className="bg-gradient-to-r from-[#F6EDEC] to-white h-16 rounded-lg overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#132A13] to-[#2d5a2d] h-full rounded-lg transition-all duration-1000 ease-out"
                          style={{ width: `${Math.min(category.progress + 20, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Decorative Corners - EXACT FIGMA STYLE */}
                <div className="absolute top-4 left-4 w-8 h-8">
                  <div className="w-8 h-8 border-l-2 border-t-2 border-[#A44A3F]" />
                </div>
                <div className="absolute top-4 right-4 w-8 h-8">
                  <div className="w-8 h-8 border-r-2 border-t-2 border-[#A44A3F]" />
                </div>
                <div className="absolute bottom-4 left-4 w-8 h-8">
                  <div className="w-8 h-8 border-l-2 border-b-2 border-[#A44A3F]" />
                </div>
                <div className="absolute bottom-4 right-4 w-8 h-8">
                  <div className="w-8 h-8 border-r-2 border-b-2 border-[#A44A3F]" />
                </div>
              </div>
            ))}
          </div>

          {/* Error State */}
          {status === "failed" && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center mt-8">
              <p className="text-red-700 text-xl">
                ❌ Scan failed. Please try again.
              </p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}