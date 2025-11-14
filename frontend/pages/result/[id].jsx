// pages/result/local.jsx - COMPLETE ENHANCED VERSION
import Head from "next/head";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import DownloadPDFButton from "../../components/DownloadPDFButton";

// Helper function for quick fix hints
const getQuickFixHint = (htmlContext, message) => {
  if (!htmlContext) return 'Inspect the element mentioned above in your code';
  
  if (htmlContext.includes('<title>')) {
    return 'Update your page title in the <head> section to be more descriptive';
  }
  if (htmlContext.includes('<h1') || htmlContext.includes('<h2') || htmlContext.includes('<h3')) {
    return 'Fix heading hierarchy - ensure H1 comes before H2, H2 before H3, etc.';
  }
  if (htmlContext.includes('<a ') && message.includes('contrast')) {
    return 'Increase the color contrast of this link text to meet WCAG standards';
  }
  if (htmlContext.includes('<img ') && message.includes('alt')) {
    return 'Add descriptive alt text to this image for screen readers';
  }
  if (htmlContext.includes('<a ') && message.includes('purpose')) {
    return 'Make link text more descriptive or add aria-label for clarity';
  }
  if (htmlContext.includes('<button')) {
    return 'Ensure button has proper labeling and contrast for accessibility';
  }
  if (htmlContext.includes('<input') || htmlContext.includes('<select')) {
    return 'Add proper labels and ensure form elements are accessible';
  }
  if (message.includes('contrast')) {
    return 'Increase color contrast ratio to at least 4.5:1 for normal text';
  }
  
  return 'Inspect this specific element in your HTML and apply the recommended fix';
};

export default function LocalResult() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("adaptivetest:lastReport");
      if (stored) {
        setReport(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Failed to load report from localStorage", err);
      setError("Failed to load report from storage");
    }
  }, []);

  // ENHANCED ISSUE DISPLAY WITH SPECIFIC HTML CONTEXT
  const transformViolations = (issues = []) => {
    console.log("Raw issues data:", issues);

    // Helper function to create actionable issue descriptions
    const createIssueDescription = (issue) => {
      const severityColors = {
        error: "🔴 HIGH",
        warning: "🟡 MEDIUM", 
        notice: "🔵 LOW"
      };

      const severityText = severityColors[issue.type] || "⚪ INFO";

      // Extract the actual HTML context safely
      const htmlContext = issue.context ? 
        issue.context.replace(/</g, '&lt;').replace(/>/g, '&gt;') 
        : 'No HTML context available';

      // Create a more specific location description
      const location = issue.selector ? 
        `CSS Selector: ${issue.selector}` : 
        'Location not specified';

      return {
        title: `${severityText} - ${issue.message}`,
        description: `
**Problem:** ${issue.message}

**Location:** ${location}

**Element Found:** 
${htmlContext}

**WCAG Rule:** ${issue.code || 'Not specified'}

**How to Fix:** ${issue.recommendation || 'Review WCAG 2.1 guidelines for this issue type.'}

**Severity:** ${issue.severity || issue.type}
        `.trim(),
        shortDescription: `${issue.message}`,
        severity: issue.severity || issue.type,
        htmlContext: htmlContext,
        selector: issue.selector,
        rawContext: issue.context,
        rawMessage: issue.message
      };
    };

    // Categorize issues with enhanced information
    const categorized = {
      titles: issues.filter(issue => 
        issue.code?.includes('H25') ||
        issue.message?.toLowerCase().includes('title') ||
        issue.context?.toLowerCase().includes('title')
      ).map(createIssueDescription),

      clickables: issues.filter(issue => 
        issue.code?.includes('H77') || issue.code?.includes('H78') || issue.code?.includes('H79') || 
        issue.code?.includes('H80') || issue.code?.includes('H81') ||
        issue.message?.toLowerCase().includes('link') ||
        issue.message?.toLowerCase().includes('button') ||
        issue.context?.toLowerCase().includes('a href') ||
        (issue.type === 'error' && issue.code?.includes('H91.A.NoContent'))
      ).map(createIssueDescription),

      graphics: issues.filter(issue => 
        issue.code?.includes('G94') || issue.code?.includes('G73') || issue.code?.includes('G74') ||
        issue.message?.toLowerCase().includes('image') ||
        issue.message?.toLowerCase().includes('img') ||
        issue.message?.toLowerCase().includes('alt text') ||
        issue.context?.toLowerCase().includes('img')
      ).map(createIssueDescription),

      readability: issues.filter(issue => 
        issue.code?.includes('G18.Fail') ||
        issue.message?.toLowerCase().includes('contrast') ||
        issue.message?.toLowerCase().includes('color') ||
        issue.recommendation?.toLowerCase().includes('colour')
      ).map(createIssueDescription),

      menus: issues.filter(issue => 
        issue.code?.includes('H48') ||
        issue.message?.toLowerCase().includes('navigation') ||
        issue.message?.toLowerCase().includes('menu') ||
        issue.context?.toLowerCase().includes('menu-item')
      ).map(createIssueDescription),

      orientation: issues.filter(issue => 
        issue.code?.includes('C32') || issue.code?.includes('C31') ||
        issue.code?.includes('C33') || issue.code?.includes('C38') ||
        issue.message?.toLowerCase().includes('position') ||
        issue.message?.toLowerCase().includes('scrolling') ||
        issue.message?.toLowerCase().includes('layout')
      ).map(createIssueDescription),

      forms: issues.filter(issue => 
        issue.message?.toLowerCase().includes('form') ||
        issue.message?.toLowerCase().includes('input') ||
        issue.message?.toLowerCase().includes('label')
      ).map(createIssueDescription),

      document: issues.filter(issue => 
        issue.message?.toLowerCase().includes('document') ||
        issue.message?.toLowerCase().includes('html') ||
        issue.message?.toLowerCase().includes('structure') ||
        issue.message?.toLowerCase().includes('semantic')
      ).map(createIssueDescription),

      carousels: [],
      tables: []
    };

    const categories = [
      { 
        key: "titles", 
        name: "Evaluating Titles", 
        description: "Page titles and headings structure",
        issues: categorized.titles
      },
      { 
        key: "clickables", 
        name: "Evaluating Clickables", 
        description: "Buttons, links, and interactive elements",
        issues: categorized.clickables
      },
      { 
        key: "graphics", 
        name: "Evaluating Graphics", 
        description: "Images, icons, and visual elements",
        issues: categorized.graphics
      },
      { 
        key: "readability", 
        name: "Evaluating Readability", 
        description: "Text contrast and legibility",
        issues: categorized.readability
      },
      { 
        key: "menus", 
        name: "Evaluating Menus", 
        description: "Navigation menus and dropdowns",
        issues: categorized.menus
      },
      { 
        key: "orientation", 
        name: "Evaluating Orientation", 
        description: "Layout and navigation flow",
        issues: categorized.orientation
      },
      { 
        key: "forms", 
        name: "Evaluating Forms", 
        description: "Input fields and form controls",
        issues: categorized.forms
      },
      { 
        key: "document", 
        name: "Evaluating Document", 
        description: "HTML semantics and structure",
        issues: categorized.document
      },
      { 
        key: "carousels", 
        name: "Evaluating Carousels", 
        description: "Sliders and rotating content",
        issues: categorized.carousels
      },
      { 
        key: "tables", 
        name: "Evaluating Tables", 
        description: "Data tables and their accessibility",
        issues: categorized.tables
      },
    ];

    return categories.map(category => ({
      ...category,
      status: category.issues.length === 0 ? "passed" : "failed",
      score: category.issues.length === 0 ? 100 : Math.max(0, 100 - (category.issues.length * 10))
    }));
  };

  const results = report ? transformViolations(report.issues || []) : [];
  const overallScore = results.length > 0 
    ? Math.round(results.reduce((acc, curr) => acc + curr.score, 0) / results.length)
    : 0;

  if (!report && !error) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
        <p className="text-2xl">Loading report...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
        <p className="text-2xl text-red-600">{error || "No local report found."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <Head>
        <title>Accessibility Report – AdaptiveTest AI</title>
        <meta name="description" content="View your website's accessibility report with specific fixes and recommendations." />
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
          
          {report?.url && (
            <div className="inline-flex items-center border border-white rounded-lg px-6 py-3 mb-8">
              <span className="font-bold text-sm">{report.url}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          {/* Results Header */}
          <div className="bg-white rounded-2xl shadow-[3px_3px_20px_rgba(0,0,0,0.20)] p-8 mb-8">
            <div className="text-center mb-8">
              <h2 className="font-amiri text-5xl md:text-6xl text-black mb-4">
                Scan Complete
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Detailed accessibility findings with specific HTML elements and fixes
              </p>
            </div>

            <div className="max-w-4xl mx-auto mb-8">
              <div className="bg-gradient-to-r from-[#F6EDEC] to-white h-16 rounded-lg mb-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#132A13] to-[#2d5a2d] h-full rounded-lg"
                  style={{ width: `${overallScore}%` }}
                />
              </div>
              <p className="text-center text-2xl font-semibold">
                Overall Accessibility Score: {overallScore}%
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto text-center">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">
                  {results.filter(r => r.status === 'passed').length}
                </div>
                <div className="text-sm text-green-800">Passed</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600">
                  {results.filter(r => r.status === 'failed').length}
                </div>
                <div className="text-sm text-red-800">Needs Fixing</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {results.reduce((acc, curr) => acc + curr.issues.length, 0)}
                </div>
                <div className="text-sm text-blue-800">Total Issues</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {results.length}
                </div>
                <div className="text-sm text-purple-800">Categories</div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center mb-8">
              <p className="text-red-700 text-xl">{error}</p>
            </div>
          )}

          {/* ENHANCED ISSUES DISPLAY WITH SPECIFIC HTML */}
          <div className="space-y-8">
            {results.map((category, index) => (
              <div 
                key={category.key}
                className="bg-white rounded-2xl shadow-[3px_3px_20px_rgba(0,0,0,0.20)] p-8 relative"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-amiri text-3xl text-black mb-2">
                      {category.name}
                    </h3>
                    <p className="text-gray-600 text-lg">{category.description}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-3xl font-bold ${
                      category.status === 'passed' ? 'text-green-600' : 'text-[#A44A3F]'
                    }`}>
                      {category.score}%
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      category.status === 'passed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {category.status === 'passed' ? 'PASSED' : 'NEEDS WORK'}
                    </span>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="bg-gradient-to-r from-[#F6EDEC] to-white h-16 rounded-lg overflow-hidden">
                    <div
                      className={`h-full rounded-lg transition-all duration-1000 ease-out ${
                        category.status === 'passed' 
                          ? 'bg-gradient-to-r from-green-500 to-green-600' 
                          : 'bg-gradient-to-r from-[#132A13] to-[#2d5a2d]'
                      }`}
                      style={{ width: `${category.score}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  {category.issues.length === 0 ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                      <p className="text-green-800 font-semibold text-lg">✅ No issues found in this category</p>
                      <p className="text-green-600 mt-2">This area meets accessibility standards</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <h4 className="font-semibold text-xl text-gray-800 mb-4">
                        Found {category.issues.length} issue{category.issues.length !== 1 ? 's' : ''}:
                      </h4>
                      {category.issues.map((issue, idx) => (
                        <div
                          key={idx}
                          className={`border rounded-lg p-5 ${
                            issue.severity === 'high' 
                              ? 'bg-red-50 border-red-300' 
                              : issue.severity === 'medium'
                              ? 'bg-orange-50 border-orange-300'
                              : 'bg-blue-50 border-blue-300'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h5 className="font-semibold text-lg flex-1">
                              {issue.title}
                            </h5>
                            <span className={`ml-2 px-2 py-1 rounded text-xs font-bold ${
                              issue.severity === 'high'
                                ? 'bg-red-200 text-red-800'
                                : issue.severity === 'medium'
                                ? 'bg-orange-200 text-orange-800'
                                : 'bg-blue-200 text-blue-800'
                            }`}>
                              {issue.severity?.toUpperCase() || 'INFO'}
                            </span>
                          </div>
                          
                          <div className="space-y-4 text-sm">
                            {/* Location */}
                            <div>
                              <strong className="flex items-center gap-2">
                                <span>📍</span>
                                <span>Location in your code:</span>
                              </strong>
                              <code className="mt-1 block bg-black/10 px-3 py-2 rounded font-mono text-xs border">
                                {issue.selector || 'Location not specified'}
                              </code>
                            </div>
                            
                            {/* HTML Element - SHOW THE ACTUAL CODE */}
                            <div>
                              <strong className="flex items-center gap-2">
                                <span>🔧</span>
                                <span>HTML Element to Fix:</span>
                              </strong>
                              {issue.rawContext ? (
                                <div className="mt-2 space-y-3">
                                  <div className="bg-gray-900 text-green-400 p-4 rounded text-xs overflow-x-auto border border-gray-700 font-mono">
                                    <div className="text-gray-400 text-xs mb-2">// PROBLEMATIC ELEMENT:</div>
                                    <div dangerouslySetInnerHTML={{ __html: issue.rawContext }} />
                                  </div>
                                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                                    <p className="text-blue-800 text-sm flex items-start gap-2">
                                      <span>💡</span>
                                      <span>
                                        <strong>Quick fix:</strong> {getQuickFixHint(issue.rawContext, issue.rawMessage)}
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <p className="mt-1 text-gray-600 italic bg-gray-50 p-3 rounded">
                                  No specific HTML element context provided
                                </p>
                              )}
                            </div>
                            
                            {/* Fix Instructions */}
                            <div>
                              <strong className="flex items-center gap-2">
                                <span>🛠️</span>
                                <span>How to Fix:</span>
                              </strong>
                              <div className="mt-1 bg-white p-3 rounded border text-gray-700">
                                {issue.description.split('How to Fix:')[1]?.split('**Severity:**')[0]?.trim() || 'Review WCAG guidelines for this issue type.'}
                              </div>
                            </div>
                            
                            {/* WCAG Reference */}
                            <div className="flex items-center justify-between">
                              <span className="bg-gray-100 px-3 py-1 rounded text-xs flex items-center gap-2">
                                <span>📚</span>
                                <span>WCAG: {issue.description.split('WCAG Rule:')[1]?.split('**')[0]?.trim() || 'Not specified'}</span>
                              </span>
                              <span className="text-xs text-gray-500">
                                ID: {idx + 1}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Decorative Corners */}
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

            {/* Download Button */}
            <div className="bg-white rounded-2xl shadow-[3px_3px_20px_rgba(0,0,0,0.20)] p-8 text-center">
              <h3 className="font-amiri text-3xl text-black mb-4">
                Download Complete Report
              </h3>
              <p className="text-gray-600 text-lg mb-6 max-w-2xl mx-auto">
                Download a detailed PDF report with all accessibility findings, specific HTML elements, and actionable fixes for your development team.
              </p>
              <DownloadPDFButton 
                report={report} 
                className="bg-[#132A13] hover:bg-[#1a3a1a] text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-flex items-center gap-2"
              >
                📄 Download PDF Report
              </DownloadPDFButton>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}