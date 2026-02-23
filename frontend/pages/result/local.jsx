// pages/result/[id].jsx - CORRECT VERSION with proper categories
import Head from "next/head";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

// Define all WCAG categories we need to evaluate
const WCAG_CATEGORIES = [
  'Evaluating Clickables',
  'Evaluating Titles',
  'Evaluating Orientation',
  'Evaluating Menus',
  'Evaluating Images',
  'Evaluating Forms',
  'Evaluating Documents',
  'Evaluating Readability',
  'Evaluating Carousels',
  'Evaluating Tables',
  'Evaluating Links',
  'Evaluating Headings',
  'Evaluaria',
  'Evaluating Language',
  'Evaluating Color Contrast',
  'Evaluating Keyboard Navigation',
  'Evaluating Focus Management',
  'Evaluating Audio/Video',
  'Evaluating Animations',
  'Evaluating Structure'
];

// Helper to get plain English issue title
const getIssueTitle = (issue) => {
  const msg = issue.message?.toLowerCase() || '';
  
  if (msg.includes('missing alt') || msg.includes('image without alt')) {
    return 'Images missing descriptive text';
  }
  if (msg.includes('contrast')) {
    return 'Text has low color contrast';
  }
  if (msg.includes('missing label') || msg.includes('form without label')) {
    return 'Form fields missing labels';
  }
  if (msg.includes('missing title')) {
    return 'Page is missing a title';
  }
  if (msg.includes('empty link')) {
    return 'Links without text';
  }
  if (msg.includes('heading structure')) {
    return 'Poor heading structure';
  }
  if (msg.includes('button without name')) {
    return 'Buttons without accessible names';
  }
  if (msg.includes('missing language')) {
    return 'Page language not specified';
  }
  if (msg.includes('keyboard focus')) {
    return 'Elements not keyboard accessible';
  }
  if (msg.includes('aria')) {
    return 'Improper ARIA attributes';
  }
  
  // Fallback
  return issue.message || 'Accessibility issue detected';
};

// Helper to determine category from issue
const getCategoryForIssue = (issue) => {
  const msg = issue.message?.toLowerCase() || '';
  const context = issue.context?.toLowerCase() || '';
  
  if (msg.includes('image') || msg.includes('alt') || context.includes('img')) {
    return 'Evaluating Images';
  }
  if (msg.includes('button') || msg.includes('link') || msg.includes('click')) {
    return 'Evaluating Clickables';
  }
  if (msg.includes('title') || msg.includes('head')) {
    return 'Evaluating Titles';
  }
  if (msg.includes('orientation') || msg.includes('rotate')) {
    return 'Evaluating Orientation';
  }
  if (msg.includes('menu') || msg.includes('nav')) {
    return 'Evaluating Menus';
  }
  if (msg.includes('form') || msg.includes('input') || msg.includes('label')) {
    return 'Evaluating Forms';
  }
  if (msg.includes('document') || msg.includes('article')) {
    return 'Evaluating Documents';
  }
  if (msg.includes('readability') || msg.includes('language')) {
    return 'Evaluating Readability';
  }
  if (msg.includes('carousel') || msg.includes('slider')) {
    return 'Evaluating Carousels';
  }
  if (msg.includes('table') || msg.includes('grid')) {
    return 'Evaluating Tables';
  }
  if (msg.includes('link')) {
    return 'Evaluating Links';
  }
  if (msg.includes('heading') || msg.includes('h1') || msg.includes('h2')) {
    return 'Evaluating Headings';
  }
  if (msg.includes('aria')) {
    return 'Evaluaria';
  }
  if (msg.includes('language')) {
    return 'Evaluating Language';
  }
  if (msg.includes('contrast') || msg.includes('color')) {
    return 'Evaluating Color Contrast';
  }
  if (msg.includes('keyboard') || msg.includes('tab')) {
    return 'Evaluating Keyboard Navigation';
  }
  if (msg.includes('focus')) {
    return 'Evaluating Focus Management';
  }
  if (msg.includes('video') || msg.includes('audio')) {
    return 'Evaluating Audio/Video';
  }
  if (msg.includes('animation') || msg.includes('motion')) {
    return 'Evaluating Animations';
  }
  
  return 'Evaluating Structure';
};

// Helper to get affected users
const getAffectedUsers = (issue) => {
  const users = [];
  const msg = issue.message?.toLowerCase() || '';
  
  if (msg.includes('image') || msg.includes('visual')) {
    users.push('👁️ Blind and visually impaired users');
  }
  if (msg.includes('keyboard')) {
    users.push('⌨️ Users who cannot use a mouse');
  }
  if (msg.includes('contrast')) {
    users.push('🎨 Users with color blindness');
  }
  if (msg.includes('heading') || msg.includes('structure')) {
    users.push('🧠 Users with cognitive disabilities');
  }
  if (msg.includes('form')) {
    users.push('👤 All users, especially those using screen readers');
  }
  
  return users.length ? users : ['👥 Users with disabilities'];
};

// Helper to get example image/context
const getElementExample = (issue) => {
  return issue.context || 'Element found on page';
};

export default function ResultPage() {
  const [report, setReport] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedIssues, setExpandedIssues] = useState({});
  const [showEmailModal, setShowEmailModal] = useState(false);

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

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const toggleIssue = (issueId) => {
    setExpandedIssues(prev => ({
      ...prev,
      [issueId]: !prev[issueId]
    }));
  };

  if (!report) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p>Loading report...</p>
      </div>
    );
  }

  // Group issues by category
  const issuesByCategory = {};
  report.issues?.forEach(issue => {
    const category = getCategoryForIssue(issue);
    if (!issuesByCategory[category]) {
      issuesByCategory[category] = [];
    }
    issuesByCategory[category].push(issue);
  });

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>Accessibility Report – AdaptiveTest AI</title>
      </Head>

      <Navbar />

      {/* Header */}
      <div className="bg-[#132A13] text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Accessibility Evaluation Results</h1>
          <p className="text-lg text-white/80">
            {report.url || 'Website scan results'}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Categories */}
        <div className="space-y-6">
          {WCAG_CATEGORIES.map(category => {
            const categoryIssues = issuesByCategory[category] || [];
            if (categoryIssues.length === 0) return null;
            
            return (
              <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Category Header */}
                <div 
                  className="bg-gray-100 p-4 cursor-pointer hover:bg-gray-200 transition flex items-center justify-between"
                  onClick={() => toggleCategory(category)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-gray-600">
                      {expandedCategories[category] ? '−' : '+'}
                    </span>
                    <h2 className="text-xl font-semibold">{category}</h2>
                  </div>
                  <span className="text-sm bg-[#132A13] text-white px-3 py-1 rounded-full">
                    {categoryIssues.length} {categoryIssues.length === 1 ? 'issue' : 'issues'}
                  </span>
                </div>

                {/* Category Issues */}
                {expandedCategories[category] && (
                  <div className="divide-y divide-gray-200">
                    {categoryIssues.map((issue, idx) => {
                      const issueId = `${category}-${idx}`;
                      const title = getIssueTitle(issue);
                      const affectedUsers = getAffectedUsers(issue);
                      const elementExample = getElementExample(issue);
                      
                      return (
                        <div key={idx} className="border-t border-gray-200">
                          {/* Issue Title (Collapsed) */}
                          <div 
                            className="p-4 cursor-pointer hover:bg-gray-50 transition flex items-start gap-3"
                            onClick={() => toggleIssue(issueId)}
                          >
                            <span className="text-gray-500 mt-1">
                              {expandedIssues[issueId] ? '−' : '+'}
                            </span>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {title}
                              </p>
                              {!expandedIssues[issueId] && (
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                  {issue.message}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Expanded Issue Details */}
                          {expandedIssues[issueId] && (
                            <div className="p-4 bg-gray-50 border-t border-gray-200">
                              <div className="space-y-4">
                                {/* Issue Description */}
                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-2">What's the issue?</h4>
                                  <p className="text-gray-700">{issue.message}</p>
                                </div>

                                {/* Who it affects */}
                                {affectedUsers.length > 0 && (
                                  <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Who it affects</h4>
                                    <ul className="list-disc list-inside space-y-1">
                                      {affectedUsers.map((user, i) => (
                                        <li key={i} className="text-gray-700">{user}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Element/Image example */}
                                {elementExample && (
                                  <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Element found</h4>
                                    <pre className="bg-gray-900 text-green-400 p-3 rounded text-sm overflow-x-auto">
                                      {elementExample}
                                    </pre>
                                  </div>
                                )}

                                {/* Recommendation/Fix */}
                                {issue.recommendation && (
                                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                                    <p className="text-yellow-800 text-sm">
                                      <strong>How to fix:</strong> {issue.recommendation}
                                    </p>
                                  </div>
                                )}

                                {/* WCAG Reference */}
                                {issue.code && (
                                  <div className="text-sm text-gray-500">
                                    WCAG Reference: {issue.code}
                                  </div>
                                )}
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

        {/* Get Full Report */}
        <div className="mt-8 text-center">
          <button
            onClick={() => setShowEmailModal(true)}
            className="bg-[#132A13] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#1a3a1a] transition"
          >
            Get the free report to your email →
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}