// pages/result/[id].jsx - SIMPLIFIED LIST VIEW (matching screenshots)
import Head from "next/head";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

// Group issues by category
const groupIssuesByCategory = (issues) => {
  const categories = {
    'General': [],
    'Interactive Content': [],
    'Forms': [],
    'Landmarks': [],
    'ARIA': [],
    'Lists': [],
    'Dragging Alternative': []
  };
  
  issues.forEach(issue => {
    const msg = issue.message?.toLowerCase() || '';
    const context = issue.context?.toLowerCase() || '';
    
    if (msg.includes('image') || msg.includes('alt') || msg.includes('img')) {
      categories['General'].push({...issue, category: 'General'});
    } else if (msg.includes('button') || msg.includes('link') || msg.includes('navigation') || msg.includes('menu')) {
      categories['Interactive Content'].push({...issue, category: 'Interactive Content'});
    } else if (msg.includes('form') || msg.includes('input') || msg.includes('label') || msg.includes('checkbox') || msg.includes('radio')) {
      categories['Forms'].push({...issue, category: 'Forms'});
    } else if (msg.includes('landmark') || msg.includes('navigation') || msg.includes('role')) {
      categories['Landmarks'].push({...issue, category: 'Landmarks'});
    } else if (msg.includes('aria')) {
      categories['ARIA'].push({...issue, category: 'ARIA'});
    } else if (msg.includes('list')) {
      categories['Lists'].push({...issue, category: 'Lists'});
    } else {
      categories['General'].push({...issue, category: 'General'});
    }
  });
  
  return categories;
};

// Get WCAG level from issue
const getWCAGLevel = (issue) => {
  if (issue.code?.includes('wcag2aa')) return 'AA';
  if (issue.code?.includes('wcag2a')) return 'A';
  if (issue.code?.includes('wcag2aaa')) return 'AAA';
  return 'A';
};

// Get success examples (mock for now - would come from API)
const getSuccessExamples = (issue) => {
  // This would be populated from your scan results
  // For now, returning mock examples
  return [
    `<img src="logo.png" alt="Company Logo">`,
    `<button type="button">Submit</button>`,
    `<a href="/about">About Us</a>`
  ];
};

export default function ResultPage() {
  const [report, setReport] = useState(null);
  const [expandedIssues, setExpandedIssues] = useState({});
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem("adaptivetest:lastReport");
      if (stored) {
        setReport(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Failed to load report", err);
    }
  }, []);

  const toggleIssue = (issueId) => {
    setExpandedIssues(prev => ({
      ...prev,
      [issueId]: !prev[issueId]
    }));
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!report) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p>Loading report...</p>
      </div>
    );
  }

  const issues = report.issues || [];
  const categories = groupIssuesByCategory(issues);
  
  // Calculate scores (mock for now)
  const scores = {
    'General': 99,
    'Interactive Content': 55,
    'Forms': 75,
    'Landmarks': 13,
    'ARIA': 50,
    'Lists': 50,
    'Dragging Alternative': 0
  };

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>Accessibility Report – AdaptiveTest AI</title>
      </Head>

      <Navbar />

      {/* Header */}
      <div className="bg-[#132A13] text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Non-compliant</h1>
          <p className="text-lg text-white/80">
            Your scan found serious accessibility issues. Let's fix them now to help you meet accessibility requirements and mitigate legal risk.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Fix WordPress CTA */}
        <div className="bg-gradient-to-r from-[#132A13] to-[#1e3a1e] rounded-lg p-6 mb-8 text-white">
          <h2 className="text-2xl font-bold mb-2">Fix your WordPress website</h2>
          <p className="mb-4">Make your website inclusive and mitigate legal risk in just a few clicks.</p>
          <button className="bg-white text-[#132A13] px-6 py-2 rounded font-semibold hover:bg-gray-100 transition">
            Start free trial on WordPress →
          </button>
        </div>

        {/* Categories */}
        {Object.entries(categories).map(([categoryName, categoryIssues]) => {
          if (categoryIssues.length === 0) return null;
          
          return (
            <div key={categoryName} className="mb-8 border border-gray-200 rounded-lg overflow-hidden">
              {/* Category Header */}
              <div 
                className="bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition flex items-center justify-between"
                onClick={() => toggleSection(categoryName)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-gray-500">
                    {expandedSections[categoryName] ? '−' : '+'}
                  </span>
                  <h2 className="text-2xl font-semibold">{categoryName}</h2>
                </div>
                {scores[categoryName] !== undefined && (
                  <div className="text-lg font-semibold">
                    Score: {scores[categoryName]}
                  </div>
                )}
              </div>

              {/* Category Issues */}
              {expandedSections[categoryName] && (
                <div className="divide-y divide-gray-200">
                  {categoryIssues.map((issue, idx) => {
                    const issueId = `${categoryName}-${idx}`;
                    const wcagLevel = getWCAGLevel(issue);
                    const isCompliant = false; // Determine from issue
                    
                    return (
                      <div key={idx} className="border-t border-gray-200">
                        {/* Issue Header */}
                        <div 
                          className="p-4 cursor-pointer hover:bg-gray-50 transition flex items-start gap-3"
                          onClick={() => toggleIssue(issueId)}
                        >
                          <span className="text-gray-500 mt-1">
                            {expandedIssues[issueId] ? '−' : '+'}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{issue.message || 'Issue'}</span>
                              <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                                {wcagLevel}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                {isCompliant ? (
                                  <>
                                    <span className="text-green-600">✓</span>
                                    <span>Compliant</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-red-600">✗</span>
                                    <span>Non-compliant</span>
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Issue Details */}
                        {expandedIssues[issueId] && (
                          <div className="p-4 bg-gray-50 border-t border-gray-200">
                            {/* Requirement */}
                            <div className="mb-4">
                              <h4 className="font-semibold mb-2">Requirement:</h4>
                              <p className="text-gray-700">
                                The alt attribute is used to provide a text alternative for images. 
                                It is not meant to be used on elements other than images and therefore 
                                will not be read using screen-readers.
                              </p>
                            </div>

                            {/* Code Snapshots of Failed Elements */}
                            {issue.context && (
                              <div className="mb-4">
                                <h4 className="font-semibold mb-2">Code snapshots of failed elements</h4>
                                <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
                                  {issue.context}
                                </pre>
                              </div>
                            )}

                            {/* Code Snapshots of Successful Elements */}
                            <div>
                              <h4 className="font-semibold mb-2">Code snapshots of successful elements</h4>
                              <div className="space-y-2">
                                {getSuccessExamples(issue).map((example, i) => (
                                  <pre key={i} className="bg-gray-800 text-green-300 p-2 rounded text-xs overflow-x-auto">
                                    {example}
                                  </pre>
                                ))}
                              </div>
                            </div>

                            {/* Get Full Report CTA */}
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <p className="text-gray-600">
                                Want to see all the elements and full details?{' '}
                                <button className="text-[#132A13] font-semibold hover:underline">
                                  Get the free report to your email →
                                </button>
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Footer />
    </div>
  );
}