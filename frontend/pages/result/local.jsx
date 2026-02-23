// pages/result/[id].jsx - COMPLETE VERSION with all features + screenshot design
import Head from "next/head";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

// Helper to determine affected users from issue
const getAffectedUsersFromIssue = (issue) => {
  const affectedUsers = new Set();
  
  if (issue.message?.toLowerCase().includes('image') || 
      issue.message?.toLowerCase().includes('alt') ||
      issue.context?.toLowerCase().includes('img')) {
    affectedUsers.add('👁️ Blind Users');
  }
  
  if (issue.message?.toLowerCase().includes('contrast') || 
      issue.message?.toLowerCase().includes('color')) {
    affectedUsers.add('🎨 Color Blind Users');
    affectedUsers.add('👁️ Low Vision Users');
  }
  
  if (issue.message?.toLowerCase().includes('keyboard') || 
      issue.message?.toLowerCase().includes('tab') ||
      issue.context?.toLowerCase().includes('button') ||
      issue.context?.toLowerCase().includes('a href')) {
    affectedUsers.add('⌨️ Motor Impaired');
    affectedUsers.add('⌨️ Keyboard-Only Users');
  }
  
  if (issue.message?.toLowerCase().includes('screen reader') || 
      issue.message?.toLowerCase().includes('aria') ||
      issue.message?.toLowerCase().includes('label')) {
    affectedUsers.add('👂 Screen Reader Users');
    affectedUsers.add('👁️ Vision Impaired');
  }
  
  if (issue.message?.toLowerCase().includes('heading') || 
      issue.message?.toLowerCase().includes('structure') ||
      issue.message?.toLowerCase().includes('semantic')) {
    affectedUsers.add('🧠 Cognitive Disability');
    affectedUsers.add('📖 All Users');
  }
  
  if (issue.message?.toLowerCase().includes('form') || 
      issue.context?.toLowerCase().includes('input')) {
    affectedUsers.add('👤 Form Users');
    affectedUsers.add('⌨️ Motor Impaired');
  }
  
  if (affectedUsers.size === 0) {
    affectedUsers.add('👥 Some Users');
  }
  
  return Array.from(affectedUsers);
};

// Helper to get plain language description
const getPlainDescription = (issue) => {
  const msg = issue.message.toLowerCase();
  
  if (msg.includes('missing') && msg.includes('alt')) {
    return 'Images without descriptions';
  }
  if (msg.includes('contrast')) {
    return 'Low color contrast text';
  }
  if (msg.includes('missing') && msg.includes('label')) {
    return 'Form fields without labels';
  }
  if (msg.includes('missing') && msg.includes('title')) {
    return 'Page missing title';
  }
  if (msg.includes('empty') && msg.includes('link')) {
    return 'Links without text';
  }
  if (msg.includes('heading')) {
    return 'Poor heading structure';
  }
  if (msg.includes('button') && msg.includes('name')) {
    return 'Buttons without names';
  }
  if (msg.includes('language')) {
    return 'Missing page language';
  }
  
  return issue.message.charAt(0).toUpperCase() + issue.message.slice(1);
};

// Get severity percentage
const getSeverityPercentage = (type) => {
  switch(type?.toLowerCase()) {
    case 'error':
    case 'critical':
      return 95;
    case 'warning':
    case 'serious':
      return 75;
    case 'notice':
    case 'moderate':
      return 50;
    default:
      return 25;
  }
};

// Get WCAG level from issue
const getWCAGLevel = (issue) => {
  if (issue.code?.includes('wcag2aa')) return 'AA';
  if (issue.code?.includes('wcag2a')) return 'A';
  if (issue.code?.includes('wcag2aaa')) return 'AAA';
  return 'A';
};

// Email Opt-In Modal Component
const EmailOptInModal = ({ isOpen, onClose, onConfirm }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    agreeToNewsletter: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          type: 'report_request',
          timestamp: new Date().toISOString()
        }),
      });

      if (response.ok) {
        await onConfirm(formData);
        onClose();
      } else {
        setSubmitError('Failed to send request. Please try again.');
      }
    } catch (error) {
      setSubmitError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="bg-[#132A13] text-white p-2 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Get Your Report</h3>
              <p className="text-gray-600 text-sm">Enter your details to receive the PDF report</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {submitError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{submitError}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#132A13] focus:border-transparent"
                placeholder="John Smith"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#132A13] focus:border-transparent"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#132A13] focus:border-transparent"
                placeholder="Acme Inc."
              />
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                name="agreeToNewsletter"
                checked={formData.agreeToNewsletter}
                onChange={handleChange}
                className="mt-1 mr-2"
              />
              <label className="text-sm text-gray-600">
                I agree to receive occasional accessibility tips and updates from Adaptive Atelier
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-[#132A13] text-white rounded-lg hover:bg-[#1a3a1a] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Sending...' : 'Get Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

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

// Group issues by category (matching screenshots)
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
    } else if (msg.includes('landmark') || msg.includes('role')) {
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

// Get success examples from scan data
const getSuccessExamples = (issue) => {
  // This would come from your scan results
  // For now, returning mock examples based on issue type
  if (issue.message?.includes('alt')) {
    return [
      '<img src="logo.png" alt="Company Logo">',
      '<img src="banner.jpg" alt="Welcome to our site">',
      '<img src="icon.svg" alt="" role="presentation">'
    ];
  }
  if (issue.message?.includes('button')) {
    return [
      '<button type="button">Submit Form</button>',
      '<button aria-label="Close">X</button>'
    ];
  }
  return [];
};

export default function ResultPage() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [expandedSections, setExpandedSections] = useState({});
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
      setError("Failed to load report");
    }
  }, []);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleIssue = (issueId) => {
    setExpandedIssues(prev => ({
      ...prev,
      [issueId]: !prev[issueId]
    }));
  };

  const handleDownloadReport = async (userDetails) => {
    try {
      const overallScore = calculateOverallScore();
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          report, 
          userDetails,
          overallScore
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AdaptiveTest-Accessibility-Report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'report_confirmation',
            email: userDetails.email,
            name: userDetails.name,
            company: userDetails.company,
            overallScore
          }),
        });
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const calculateOverallScore = () => {
    if (!report?.issues) return 100;
    const criticalCount = report.issues.filter(i => 
      i.type === 'error' || i.type === 'critical'
    ).length;
    return Math.max(0, 100 - (criticalCount * 5) - (report.issues.length * 0.5));
  };

  if (!report && !error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-2xl">Loading report...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-2xl text-red-600">{error || "No report found."}</p>
      </div>
    );
  }

  const issues = report.issues || [];
  const categories = groupIssuesByCategory(issues);
  const overallScore = calculateOverallScore();

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>Accessibility Report – AdaptiveTest AI</title>
        <meta name="description" content="View your website's accessibility report with specific fixes and recommendations." />
      </Head>

      <Navbar />

      {/* Header */}
      <div className="bg-[#132A13] text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Non-compliant</h1>
          <p className="text-lg text-white/80">
            Your scan found serious accessibility issues. Let's fix them now to help you meet accessibility requirements and mitigate legal risk.
          </p>
          {report?.url && (
            <div className="mt-4 text-white/60 text-sm">
              Scanned: {report.url}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* WordPress CTA */}
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
          
          // Calculate category score
          const categoryScore = Math.max(0, 100 - (categoryIssues.length * 5));
          
          return (
            <div key={categoryName} className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
              {/* Category Header */}
              <div 
                className="bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition flex items-center justify-between"
                onClick={() => toggleSection(categoryName)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-gray-500">
                    {expandedSections[categoryName] ? '−' : '+'}
                  </span>
                  <h2 className="text-xl font-semibold">{categoryName}</h2>
                </div>
                <div className="text-lg font-semibold">
                  Score: {categoryScore}
                </div>
              </div>

              {/* Category Issues */}
              {expandedSections[categoryName] && (
                <div className="divide-y divide-gray-200">
                  {categoryIssues.map((issue, idx) => {
                    const issueId = `${categoryName}-${idx}`;
                    const wcagLevel = getWCAGLevel(issue);
                    const severityScore = getSeverityPercentage(issue.type);
                    const affectedUsers = getAffectedUsersFromIssue(issue);
                    
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
                              <span className="font-medium">
                                {getPlainDescription(issue)}
                              </span>
                              <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                                {wcagLevel}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <span className={`${severityScore > 70 ? 'text-red-600' : 'text-orange-600'} font-bold`}>
                                  {severityScore}%
                                </span>
                                <span>Severity</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="text-red-600">✗</span>
                                <span>Non-compliant</span>
                              </span>
                              {affectedUsers.length > 0 && (
                                <span className="text-sm text-gray-500">
                                  Affects: {affectedUsers.slice(0, 2).join(', ')}
                                  {affectedUsers.length > 2 && '...'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expanded Issue Details */}
                        {expandedIssues[issueId] && (
                          <div className="p-4 bg-gray-50 border-t border-gray-200">
                            {/* Requirement */}
                            <div className="mb-4">
                              <h4 className="font-semibold mb-2">Requirement:</h4>
                              <p className="text-gray-700 text-sm">
                                {issue.message || 'Accessibility requirement description'}
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
                            <div className="mb-4">
                              <h4 className="font-semibold mb-2">Code snapshots of successful elements</h4>
                              <div className="space-y-2">
                                {getSuccessExamples(issue).map((example, i) => (
                                  <pre key={i} className="bg-gray-800 text-green-300 p-2 rounded text-xs overflow-x-auto">
                                    {example}
                                  </pre>
                                ))}
                              </div>
                            </div>

                            {/* Quick Fix Hint */}
                            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded p-3">
                              <p className="text-yellow-800 text-sm">
                                <strong>Quick tip:</strong> {getQuickFixHint(issue.context, issue.message)}
                              </p>
                            </div>

                            {/* WCAG Reference */}
                            {issue.code && (
                              <div className="text-sm text-gray-500">
                                WCAG Reference: {issue.code}
                              </div>
                            )}
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

        {/* Get Full Report CTA */}
        <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
          <p className="text-gray-700 mb-4">
            Want to see all the elements and full details? Get the complete report with every issue, code snippets, and detailed fixes.
          </p>
          <button
            onClick={() => setShowEmailModal(true)}
            className="bg-[#132A13] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#1a3a1a] transition"
          >
            Get the free report to your email →
          </button>
        </div>
      </div>

      {/* Email Opt-In Modal */}
      <EmailOptInModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onConfirm={handleDownloadReport}
      />

      <Footer />
    </div>
  );
}