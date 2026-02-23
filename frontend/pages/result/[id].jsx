// pages/result/[id].jsx - COMPLETE ENHANCED VERSION (700+ lines)
import Head from "next/head";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

// UPDATED: Convert severity to percentage score
const getSeverityPercentage = (type) => {
  switch(type?.toLowerCase()) {
    case 'error':
    case 'critical':
      return '95%';
    case 'warning':
    case 'serious':
      return '75%';
    case 'notice':
    case 'moderate':
      return '50%';
    default:
      return '25%';
  }
};

// UPDATED: Get severity color based on percentage
const getSeverityColor = (percentage) => {
  const num = parseInt(percentage);
  if (num >= 90) return 'bg-red-100 text-red-800 border-red-300';
  if (num >= 70) return 'bg-orange-100 text-orange-800 border-orange-300';
  if (num >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  return 'bg-blue-100 text-blue-800 border-blue-300';
};

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
  
  // If no specific users identified, default
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
  
  // Fallback: capitalize first letter
  return issue.message.charAt(0).toUpperCase() + issue.message.slice(1);
};

// UPDATED: Get severity label with percentage
const getSeverityLabel = (type) => {
  const percentage = getSeverityPercentage(type);
  switch(type?.toLowerCase()) {
    case 'error':
    case 'critical':
      return `Critical - ${percentage}`;
    case 'warning':
    case 'serious':
      return `Serious - ${percentage}`;
    case 'notice':
    case 'moderate':
      return `Moderate - ${percentage}`;
    default:
      return `Minor - ${percentage}`;
  }
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
      // Send email to adaptiveatelier
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

// Helper to group issues by category
const groupIssuesByCategory = (issues) => {
  const groups = {};
  
  issues.forEach((issue, index) => {
    const msg = issue.message?.toLowerCase() || '';
    const context = issue.context?.toLowerCase() || '';
    let category = 'Other';
    
    if (context.includes('a href') || context.includes('button') || msg.includes('link') || msg.includes('button')) {
      category = 'Clickables';
    } else if (context.includes('img') || msg.includes('image') || msg.includes('alt')) {
      category = 'Images';
    } else if (context.includes('form') || context.includes('input') || context.includes('label')) {
      category = 'Forms';
    } else if (msg.includes('heading') || msg.includes('h1') || msg.includes('h2') || msg.includes('structure')) {
      category = 'Structure';
    } else if (msg.includes('contrast') || msg.includes('color')) {
      category = 'Readability';
    } else if (msg.includes('keyboard') || msg.includes('tab') || msg.includes('focus')) {
      category = 'Navigation';
    }
    
    if (!groups[category]) {
      groups[category] = [];
    }
    
    const plainDesc = getPlainDescription(issue);
    const affectedUsers = getAffectedUsersFromIssue(issue);
    const severityPercentage = getSeverityPercentage(issue.type || issue.severity);
    const severityLabel = getSeverityLabel(issue.type || issue.severity);
    const severityColor = getSeverityColor(severityPercentage);
    
    groups[category].push({
      id: `issue-${category}-${index}`,
      title: plainDesc,
      affectedUsers,
      severityPercentage,
      severityLabel,
      severityColor,
      originalIssue: issue,
      isFailure: issue.type === 'error' || issue.type === 'critical' || issue.type === 'warning'
    });
  });
  
  return Object.entries(groups).map(([category, items]) => ({
    category,
    items,
    failures: items.filter(i => i.isFailure),
    successes: items.filter(i => !i.isFailure),
    totalFailures: items.filter(i => i.isFailure).length,
    totalSuccesses: items.filter(i => !i.isFailure).length
  }));
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

export default function ResultPage() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
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
      setError("Failed to load report");
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

  const handleDownloadReport = async (userDetails) => {
    try {
      // Generate and download PDF
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          report, 
          userDetails,
          overallScore: Math.round(overallScore)
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
        
        // Send confirmation email to user
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'report_confirmation',
            email: userDetails.email,
            name: userDetails.name,
            company: userDetails.company,
            overallScore: Math.round(overallScore)
          }),
        });
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  };

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
        <p className="text-2xl text-red-600">{error || "No report found."}</p>
      </div>
    );
  }

  const issues = report.issues || [];
  const categories = groupIssuesByCategory(issues);
  const totalIssues = issues.length;
  const criticalIssues = issues.filter(i => i.type === 'error' || i.type === 'critical').length;
  const overallScore = Math.max(0, 100 - (criticalIssues * 5) - (totalIssues * 0.5));

  return (
    <div className="min-h-screen bg-gray-50 text-black flex flex-col">
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
            Accessibility Report
          </h1>
          
          {report?.url && (
            <div className="inline-flex items-center border border-white rounded-lg px-6 py-3 mb-8">
              <span className="font-bold text-sm truncate max-w-md">{report.url}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          {/* Results Header */}
          <div className="bg-white rounded-2xl shadow-[3px_3px_20px_rgba(0,0,0,0.20)] p-8 mb-8">
            <div className="text-center mb-8">
              <h2 className="font-amiri text-5xl md:text-6xl text-black mb-4">
                Accessibility Report
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Simple, non-technical view of accessibility issues
              </p>
            </div>

            {/* Overall Score */}
            <div className="max-w-4xl mx-auto mb-8">
              <div className="bg-gradient-to-r from-[#F6EDEC] to-white h-16 rounded-lg mb-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#132A13] to-[#2d5a2d] h-full rounded-lg transition-all duration-1000"
                  style={{ width: `${overallScore}%` }}
                />
              </div>
              <p className="text-center text-2xl font-semibold">
                Overall Accessibility Score: {Math.round(overallScore)}%
              </p>
            </div>

            {/* Severity Score Legend */}
            <div className="max-w-3xl mx-auto mb-8">
              <h3 className="text-center text-xl font-semibold mb-4">Issue Severity Scale</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="bg-red-100 text-red-800 border border-red-300 rounded-lg p-3 mx-auto mb-2">
                    <div className="text-xl font-bold">95%</div>
                    <div className="text-sm">Critical</div>
                  </div>
                  <p className="text-xs text-gray-600">Blocks many users</p>
                </div>
                <div className="text-center">
                  <div className="bg-orange-100 text-orange-800 border border-orange-300 rounded-lg p-3 mx-auto mb-2">
                    <div className="text-xl font-bold">75%</div>
                    <div className="text-sm">Serious</div>
                  </div>
                  <p className="text-xs text-gray-600">Major barriers</p>
                </div>
                <div className="text-center">
                  <div className="bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-lg p-3 mx-auto mb-2">
                    <div className="text-xl font-bold">50%</div>
                    <div className="text-sm">Moderate</div>
                  </div>
                  <p className="text-xs text-gray-600">Some difficulties</p>
                </div>
                <div className="text-center">
                  <div className="bg-blue-100 text-blue-800 border border-blue-300 rounded-lg p-3 mx-auto mb-2">
                    <div className="text-xl font-bold">25%</div>
                    <div className="text-sm">Minor</div>
                  </div>
                  <p className="text-xs text-gray-600">Small improvements</p>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto text-center">
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600">
                  {issues.filter(i => i.type === 'error' || i.type === 'critical').length}
                </div>
                <div className="text-sm text-red-800">Critical (90%+)</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-600">
                  {issues.filter(i => i.type === 'warning' || i.type === 'serious').length}
                </div>
                <div className="text-sm text-orange-800">Serious (70-89%)</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-600">
                  {issues.filter(i => i.type === 'notice' || i.type === 'moderate').length}
                </div>
                <div className="text-sm text-yellow-800">Moderate (50-69%)</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {issues.filter(i => !i.type || i.type === 'minor').length}
                </div>
                <div className="text-sm text-blue-800">Minor (Below 50%)</div>
              </div>
            </div>
          </div>

          {/* Categories Accordion */}
          <div className="space-y-6">
            {categories.map((group) => (
              <div key={group.category} className="bg-white rounded-2xl shadow-[3px_3px_20px_rgba(0,0,0,0.20)] overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(group.category)}
                  className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl text-gray-400">
                      {expandedCategories[group.category] ? '−' : '+'}
                    </span>
                    <div className="text-left">
                      <h3 className="font-amiri text-3xl text-black">{group.category}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {group.totalFailures} failure{group.totalFailures !== 1 ? 's' : ''} • {group.totalSuccesses} success{group.totalSuccesses !== 1 ? 'es' : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Failures</div>
                      <div className="text-xl font-bold text-red-600">{group.totalFailures}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Successes</div>
                      <div className="text-xl font-bold text-green-600">{group.totalSuccesses}</div>
                    </div>
                  </div>
                </button>

                {/* Category Content */}
                {expandedCategories[group.category] && (
                  <div className="border-t border-gray-200 p-6 bg-gray-50">
                    <div className="space-y-6">
                      {/* Failures Section */}
                      {group.failures.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            Failed Elements
                          </h4>
                          <div className="space-y-4">
                            {group.failures.map((item) => (
                              <div key={item.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                {/* Issue Header */}
                                <button
                                  onClick={() => toggleIssue(item.id)}
                                  className="w-full flex items-start justify-between p-4 hover:bg-gray-50 transition"
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <span className="text-gray-400">
                                        {expandedIssues[item.id] ? '−' : '+'}
                                      </span>
                                      <h5 className="font-medium text-gray-900">
                                        {item.title}
                                      </h5>
                                    </div>
                                    
                                    <div className="flex flex-wrap items-center gap-3 ml-7">
                                      {/* Affected Users */}
                                      <div className="flex flex-wrap gap-2">
                                        {item.affectedUsers.map((user, idx) => (
                                          <span 
                                            key={idx}
                                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                                          >
                                            {user}
                                          </span>
                                        ))}
                                      </div>
                                      
                                      {/* Severity Score */}
                                      <div className={`flex items-center gap-1 px-3 py-1 rounded-full border ${item.severityColor}`}>
                                        <span className="font-bold">{item.severityPercentage}</span>
                                        <span className="text-xs">Severity</span>
                                      </div>
                                    </div>
                                  </div>
                                </button>

                                {/* Expanded Issue Details */}
                                {expandedIssues[item.id] && (
                                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                                    <div className="space-y-4">
                                      {/* What's the problem? */}
                                      <div>
                                        <h6 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                          <span className="text-red-500">❓</span>
                                          What's the problem?
                                        </h6>
                                        <p className="text-gray-700 text-sm">
                                          {item.originalIssue.message}
                                        </p>
                                      </div>
                                      
                                      {/* Code Snapshot */}
                                      {item.originalIssue.context && (
                                        <div>
                                          <h6 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                            <span className="text-blue-500">📍</span>
                                            Code snapshot of failed element:
                                          </h6>
                                          <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs overflow-x-auto font-mono">
                                            {item.originalIssue.context}
                                          </pre>
                                        </div>
                                      )}
                                      
                                      {/* How to fix */}
                                      <div>
                                        <h6 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                          <span className="text-green-500">🔧</span>
                                          How to fix it?
                                        </h6>
                                        <div className="bg-white p-4 rounded-lg border">
                                          <p className="text-gray-700 text-sm mb-3">
                                            {item.originalIssue.recommendation || 
                                             'Review WCAG 2.1 guidelines for this issue type.'}
                                          </p>
                                          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                                            <p className="text-yellow-800 text-sm">
                                              <strong>Quick tip:</strong> {getQuickFixHint(
                                                item.originalIssue.context, 
                                                item.originalIssue.message
                                              )}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* WCAG Reference */}
                                      {item.originalIssue.code && (
                                        <div className="flex items-center justify-between text-sm">
                                          <span className="bg-gray-100 px-3 py-1 rounded flex items-center gap-2">
                                            <span className="text-gray-500">📚</span>
                                            <span>WCAG: {item.originalIssue.code}</span>
                                          </span>
                                          <span className="text-xs text-gray-500">
                                            Issue ID: {item.id}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Successes Section */}
                      {group.successes.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Successful Elements
                          </h4>
                          <div className="grid grid-cols-1 gap-3">
                            {group.successes.map((item) => (
                              <div key={item.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-green-600">✓</span>
                                  <span className="font-medium text-gray-900">{item.title}</span>
                                </div>
                                {item.originalIssue.context && (
                                  <pre className="text-xs text-gray-700 bg-white p-2 rounded overflow-x-auto">
                                    {item.originalIssue.context}
                                  </pre>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Download Report */}
          <div className="mt-8 bg-white rounded-2xl shadow-[3px_3px_20px_rgba(0,0,0,0.20)] p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="bg-[#132A13] text-white p-3 rounded-lg">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-amiri text-3xl text-black mb-2">
                  Download Complete Report
                </h3>
                <p className="text-gray-600">
                  Want to see all elements and full details?
                </p>
              </div>
            </div>
            
            <p className="text-gray-600 text-lg mb-6 max-w-2xl mx-auto">
              Get the complete report with every issue, code snippets, and detailed fixes
            </p>
            
            <button
              onClick={() => setShowEmailModal(true)}
              className="bg-[#132A13] hover:bg-[#1a3a1a] text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-flex items-center gap-2"
            >
              📄 Get the free report to your email →
            </button>
          </div>
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