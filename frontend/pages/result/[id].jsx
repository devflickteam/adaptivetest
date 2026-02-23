// pages/result/[id].jsx - UPDATED WITH PERCENTAGE SEVERITY SCORES & EMAIL MODAL
import Head from "next/head";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

// UPDATED: Convert severity to percentage score
const getSeverityPercentage = (type) => {
  switch(type?.toLowerCase()) {
    case 'error':
    case 'critical':
      return '95%'; // Highest impact
    case 'warning':
    case 'serious':
      return '75%'; // High impact
    case 'notice':
    case 'moderate':
      return '50%'; // Medium impact
    default:
      return '25%'; // Low impact
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
    affectedUsers.add('⌨️ Keyboard-Only Users');
  }
  
  if (issue.message?.toLowerCase().includes('screen reader') || 
      issue.message?.toLowerCase().includes('aria') ||
      issue.message?.toLowerCase().includes('label')) {
    affectedUsers.add('👂 Screen Reader Users');
  }
  
  if (issue.message?.toLowerCase().includes('heading') || 
      issue.message?.toLowerCase().includes('structure') ||
      issue.message?.toLowerCase().includes('semantic')) {
    affectedUsers.add('📖 All Users');
  }
  
  if (issue.message?.toLowerCase().includes('form') || 
      issue.context?.toLowerCase().includes('input')) {
    affectedUsers.add('👤 Form Users');
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

export default function ResultPage() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [expandedAccordions, setExpandedAccordions] = useState({});
  const [showEmailModal, setShowEmailModal] = useState(false);

  useEffect(() => {
    // Load report from localStorage (or API)
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

  // Transform issues into accordion items
  const transformIssuesToAccordions = (issues = []) => {
    if (!issues.length) return [];
    
    return issues.map((issue, index) => {
      const plainDesc = getPlainDescription(issue);
      const affectedUsers = getAffectedUsersFromIssue(issue);
      const severityPercentage = getSeverityPercentage(issue.type || issue.severity);
      const severityLabel = getSeverityLabel(issue.type || issue.severity);
      const severityColor = getSeverityColor(severityPercentage);
      
      return {
        id: index,
        title: plainDesc,
        affectedUsers: affectedUsers,
        severityPercentage: severityPercentage,
        severityLabel: severityLabel,
        severityColor: severityColor,
        // Original data for expanded view
        originalIssue: issue,
        // For categorization
        category: determineCategory(issue)
      };
    });
  };

  // Helper for categorization
  const determineCategory = (issue) => {
    const msg = issue.message.toLowerCase();
    if (msg.includes('image') || msg.includes('alt')) return 'Images';
    if (msg.includes('contrast') || msg.includes('color')) return 'Readability';
    if (msg.includes('link') || msg.includes('button')) return 'Clickables';
    if (msg.includes('form') || msg.includes('input')) return 'Forms';
    if (msg.includes('heading') || msg.includes('title')) return 'Structure';
    if (msg.includes('keyboard') || msg.includes('tab')) return 'Navigation';
    return 'Other';
  };

  // Group accordions by category
  const groupAccordionsByCategory = (accordions) => {
    const groups = {};
    
    accordions.forEach(accordion => {
      if (!groups[accordion.category]) {
        groups[accordion.category] = [];
      }
      groups[accordion.category].push(accordion);
    });
    
    return Object.entries(groups).map(([category, items]) => ({
      category,
      items,
      count: items.length
    }));
  };

  const accordions = report ? transformIssuesToAccordions(report.issues || []) : [];
  const groupedAccordions = groupAccordionsByCategory(accordions);
  
  // Calculate overall score (inverse of severity)
  const overallScore = accordions.length > 0 
    ? Math.max(0, 100 - (accordions.reduce((acc, curr) => {
        const severityNum = parseInt(curr.severityPercentage);
        return acc + (severityNum / 100 * 20); // Weighted calculation
      }, 0) / accordions.length))
    : 100;

  const toggleAccordion = (id) => {
    setExpandedAccordions(prev => ({
      ...prev,
      [id]: !prev[id]
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
              <span className="font-bold text-sm truncate max-w-md">{report.url}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white py-12">
        <div className="max-w-6xl mx-auto px-4">
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

            {/* NEW: Severity Score Legend */}
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
                  {accordions.filter(a => parseInt(a.severityPercentage) >= 90).length}
                </div>
                <div className="text-sm text-red-800">Critical (90%+)</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-600">
                  {accordions.filter(a => 
                    parseInt(a.severityPercentage) >= 70 && 
                    parseInt(a.severityPercentage) < 90
                  ).length}
                </div>
                <div className="text-sm text-orange-800">Serious (70-89%)</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-600">
                  {accordions.filter(a => 
                    parseInt(a.severityPercentage) >= 50 && 
                    parseInt(a.severityPercentage) < 70
                  ).length}
                </div>
                <div className="text-sm text-yellow-800">Moderate (50-69%)</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {accordions.filter(a => parseInt(a.severityPercentage) < 50).length}
                </div>
                <div className="text-sm text-blue-800">Minor (Below 50%)</div>
              </div>
            </div>
          </div>

          {/* ACCORDION-BASED ISSUES DISPLAY */}
          <div className="space-y-8">
            {groupedAccordions.map((group, groupIndex) => (
              <div key={groupIndex} className="bg-white rounded-2xl shadow-[3px_3px_20px_rgba(0,0,0,0.20)] p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-amiri text-3xl text-black">
                    {group.category} Issues
                  </h3>
                  <span className="bg-gray-100 text-gray-800 px-4 py-2 rounded-full font-semibold">
                    {group.count} issue{group.count !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-4">
                  {group.items.map((accordion) => (
                    <div 
                      key={accordion.id}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      {/* ACCORDION HEADER */}
                      <button
                        onClick={() => toggleAccordion(accordion.id)}
                        className="w-full flex justify-between items-center p-6 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          {/* Plain Language Title */}
                          <div className="flex items-start gap-3">
                            <span className="text-2xl text-gray-400">
                              {expandedAccordions[accordion.id] ? '−' : '+'}
                            </span>
                            <div className="flex-1">
                              {/* Issue Title */}
                              <h4 className="font-semibold text-lg text-gray-900 mb-2">
                                {accordion.title}
                              </h4>
                              
                              <div className="flex flex-wrap items-center gap-3">
                                {/* Affected Users */}
                                <div className="flex flex-wrap gap-2">
                                  {accordion.affectedUsers.map((user, idx) => (
                                    <span 
                                      key={idx}
                                      className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
                                    >
                                      {user}
                                    </span>
                                  ))}
                                </div>
                                
                                {/* Severity Score Badge */}
                                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${accordion.severityColor}`}>
                                  <span className="font-bold">{accordion.severityPercentage}</span>
                                  <span className="text-xs font-semibold">
                                    {accordion.severityPercentage === '95%' ? 'CRITICAL' :
                                     accordion.severityPercentage === '75%' ? 'SERIOUS' :
                                     accordion.severityPercentage === '50%' ? 'MODERATE' :
                                     'MINOR'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Arrow Icon */}
                        <div className="ml-4">
                          <svg 
                            className={`w-5 h-5 transition-transform ${
                              expandedAccordions[accordion.id] ? 'rotate-180' : ''
                            }`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>
                      
                      {/* ACCORDION CONTENT (Expanded) */}
                      {expandedAccordions[accordion.id] && (
                        <div className="p-6 border-t border-gray-200 bg-gray-50">
                          <div className="space-y-6">
                            {/* What's the problem? */}
                            <div>
                              <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <span className="text-red-500">❓</span>
                                What's the problem?
                              </h5>
                              <p className="text-gray-700">
                                {accordion.originalIssue.message}
                              </p>
                            </div>
                            
                            {/* Where is it? */}
                            <div>
                              <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <span className="text-blue-500">📍</span>
                                Where is it in your code?
                              </h5>
                              {accordion.originalIssue.selector && (
                                <code className="block bg-gray-900 text-green-400 p-3 rounded text-sm overflow-x-auto font-mono mb-2">
                                  {accordion.originalIssue.selector}
                                </code>
                              )}
                              {accordion.originalIssue.context && (
                                <div className="bg-gray-800 text-gray-300 p-3 rounded text-sm overflow-x-auto">
                                  <div className="text-gray-500 text-xs mb-1">HTML Element:</div>
                                  <pre>{accordion.originalIssue.context}</pre>
                                </div>
                              )}
                            </div>
                            
                            {/* How to fix it? */}
                            <div>
                              <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <span className="text-green-500">🔧</span>
                                How to fix it?
                              </h5>
                              <div className="bg-white p-4 rounded-lg border">
                                <p className="text-gray-700 mb-3">
                                  {accordion.originalIssue.recommendation || 
                                   'Review WCAG 2.1 guidelines for this issue type.'}
                                </p>
                                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                                  <p className="text-yellow-800 text-sm">
                                    <strong>Quick tip:</strong> {getQuickFixHint(
                                      accordion.originalIssue.context, 
                                      accordion.originalIssue.message
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {/* WCAG Reference */}
                            <div className="flex items-center justify-between">
                              <span className="bg-gray-100 px-3 py-1 rounded text-sm flex items-center gap-2">
                                <span className="text-gray-500">📚</span>
                                <span>WCAG: {accordion.originalIssue.code || 'Not specified'}</span>
                              </span>
                              <span className="text-xs text-gray-500">
                                Issue ID: {accordion.id + 1}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Download Report - UPDATED WITH MODAL */}
            <div className="bg-white rounded-2xl shadow-[3px_3px_20px_rgba(0,0,0,0.20)] p-8 text-center">
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
                    Get a detailed PDF report with Adaptive Atelier branding
                  </p>
                </div>
              </div>
              
              <p className="text-gray-600 text-lg mb-6 max-w-2xl mx-auto">
                Enter your email to receive a professional PDF report with your accessibility score: {Math.round(overallScore)}%
              </p>
              
              <button
                onClick={() => setShowEmailModal(true)}
                className="bg-[#132A13] hover:bg-[#1a3a1a] text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-flex items-center gap-2"
              >
                📄 Get PDF Report
              </button>
              
              <p className="text-sm text-gray-500 mt-4">
                Report includes Adaptive Atelier branding and matches the structure you see here
              </p>
            </div>
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