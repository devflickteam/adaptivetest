// pages/result/[id].jsx - FIXED with proper text and styling
import Head from "next/head";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

// Helper functions (keeping all our comprehensive functionality)
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

const getSeverityColor = (percentage) => {
  const num = parseInt(percentage);
  if (num >= 90) return 'bg-red-100 text-red-800 border-red-300';
  if (num >= 70) return 'bg-orange-100 text-orange-800 border-orange-300';
  if (num >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  return 'bg-blue-100 text-blue-800 border-blue-300';
};

// FIXED: Changed "accessible" to "accessibility" in all issue titles
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
    return 'Buttons without accessibility names';
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
  
  return issue.message || 'Accessibility issue detected';
};

const getAffectedUsers = (issue) => {
  const users = [];
  const msg = issue.message?.toLowerCase() || '';
  
  if (msg.includes('image') || msg.includes('visual') || msg.includes('alt')) {
    users.push('👁️ Blind and visually impaired users');
  }
  if (msg.includes('keyboard') || msg.includes('tab') || msg.includes('focus')) {
    users.push('⌨️ Users who cannot use a mouse');
  }
  if (msg.includes('contrast') || msg.includes('color')) {
    users.push('🎨 Users with color blindness');
  }
  if (msg.includes('heading') || msg.includes('structure')) {
    users.push('🧠 Users with cognitive disabilities');
  }
  if (msg.includes('form') || msg.includes('input') || msg.includes('label')) {
    users.push('👤 All users, especially those using screen readers');
  }
  if (msg.includes('link') || msg.includes('button')) {
    users.push('🖱️ Users navigating by links/buttons');
  }
  if (msg.includes('audio') || msg.includes('video')) {
    users.push('🎧 Deaf or hard of hearing users');
  }
  
  return users.length ? users : ['👥 Users with disabilities'];
};

const getWCAGInfo = (issue) => {
  const code = issue.code?.toLowerCase() || '';
  const msg = issue.message?.toLowerCase() || '';
  
  let version = 'WCAG 2.1';
  let criterion = '';
  let level = 'A';
  
  if (code.includes('aria') || msg.includes('aria-') || msg.includes('role=') || msg.includes('aria')) {
    version = 'ARIA';
    if (msg.includes('required attribute') || code.includes('aria-required')) {
      criterion = 'ARIA Required Attributes';
    } else if (msg.includes('aria-') || code.includes('aria-')) {
      criterion = 'ARIA Attribute Usage';
    } else if (msg.includes('role')) {
      criterion = 'ARIA Role Usage';
    } else if (msg.includes('labelledby') || msg.includes('describedby')) {
      criterion = 'ARIA Relationships';
    } else {
      criterion = 'ARIA Implementation';
    }
    return { version, criterion, level };
  }
  
  if (code.includes('wcag2a') || msg.includes('wcag 2.0') || msg.includes('wcag2.0')) {
    version = 'WCAG 2.0';
    
    if (code.includes('1.1.1') || msg.includes('non-text content') || msg.includes('alt')) {
      criterion = '1.1.1 Non-text Content';
    } else if (code.includes('1.2.1') || msg.includes('audio-only') || msg.includes('video-only')) {
      criterion = '1.2.1 Audio-only and Video-only';
    } else if (code.includes('1.3.1') || msg.includes('info and relationships') || msg.includes('structure')) {
      criterion = '1.3.1 Info and Relationships';
    } else if (code.includes('2.1.1') || msg.includes('keyboard')) {
      criterion = '2.1.1 Keyboard';
    } else if (code.includes('2.4.4') || msg.includes('link purpose') || msg.includes('link text')) {
      criterion = '2.4.4 Link Purpose (In Context)';
    } else if (code.includes('3.3.2') || msg.includes('labels') || msg.includes('instructions')) {
      criterion = '3.3.2 Labels or Instructions';
    } else if (code.includes('4.1.2') || msg.includes('name') || msg.includes('role') || msg.includes('value')) {
      criterion = '4.1.2 Name, Role, Value';
    }
  }
  
  else if (code.includes('wcag21') || msg.includes('wcag 2.1') || msg.includes('wcag2.1')) {
    version = 'WCAG 2.1';
    
    if (code.includes('1.3.4') || msg.includes('orientation')) {
      criterion = '1.3.4 Orientation';
    } else if (code.includes('1.3.5') || msg.includes('identify input purpose')) {
      criterion = '1.3.5 Identify Input Purpose';
    } else if (code.includes('1.4.10') || msg.includes('reflow')) {
      criterion = '1.4.10 Reflow';
    } else if (code.includes('1.4.11') || msg.includes('non-text contrast')) {
      criterion = '1.4.11 Non-text Contrast';
    } else if (code.includes('2.5.1') || msg.includes('pointer gestures')) {
      criterion = '2.5.1 Pointer Gestures';
    } else if (code.includes('4.1.3') || msg.includes('status messages')) {
      criterion = '4.1.3 Status Messages';
    }
  }
  
  else if (code.includes('wcag22') || msg.includes('wcag 2.2') || msg.includes('wcag2.2')) {
    version = 'WCAG 2.2';
    
    if (code.includes('2.4.11') || msg.includes('focus appearance')) {
      criterion = '2.4.11 Focus Appearance (Minimum)';
    } else if (code.includes('2.4.12') || msg.includes('focus appearance enhanced')) {
      criterion = '2.4.12 Focus Appearance (Enhanced)';
    } else if (code.includes('2.5.7') || msg.includes('dragging movements')) {
      criterion = '2.5.7 Dragging Movements';
    } else if (code.includes('3.2.6') || msg.includes('consistent help')) {
      criterion = '3.2.6 Consistent Help';
    } else if (code.includes('3.3.7') || msg.includes('redundant entry')) {
      criterion = '3.3.7 Redundant Entry';
    }
  }
  
  if (code.includes('level-aaa') || msg.includes('aaa')) {
    level = 'AAA';
  } else if (code.includes('level-aa') || msg.includes('aa')) {
    level = 'AA';
  }
  
  return { version, criterion, level };
};

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
    return 'Evaluating ARIA';
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
    const totalIssues = report.issues.length;
    return Math.max(0, Math.round(100 - (criticalCount * 5) - (totalIssues * 0.5)));
  };

  if (!report) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-2xl">Loading report...</p>
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

  const overallScore = calculateOverallScore();
  const totalIssues = report.issues?.length || 0;

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>Accessibility Report – AdaptiveTest AI</title>
      </Head>

      <Navbar />

      {/* Hero Section - Exactly like Figma */}
      <div className="relative bg-[#132A13] min-h-[692px] overflow-hidden">
        {/* Background circles */}
        <div className="absolute w-[1386px] h-[1386px] left-[267px] top-[-131px] border border-white/30 rounded-full" />
        <div className="absolute w-[1219px] h-[1219px] left-[351px] top-[-47px] border border-white rounded-full" />
        
        <div className="relative max-w-7xl mx-auto px-4 pt-32">
          <div className="text-center">
            <h1 className="font-amiri text-[120px] leading-[100px] text-white mb-8">
              AdaptiveTest AI
            </h1>
            
            {/* URL Input Bar */}
            {report?.url && (
              <div className="inline-flex items-center">
                <div className="w-[386px] h-[50px] outline outline-1 outline-white flex items-center px-6">
                  <span className="text-white text-[13.56px] font-bold font-['Arial']">
                    {report.url.replace(/^https?:\/\//, '')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Container - White card with shadow */}
      <div className="max-w-7xl mx-auto px-4 -mt-20 relative z-10">
        <div className="bg-white rounded-2xl shadow-[3px_3px_20px_rgba(0,0,0,0.20)] p-8">
          
          {/* Header */}
          <div className="mb-12">
            <h2 className="font-amiri text-[100px] leading-[100px] text-black">
              Web Accessibility Audit
            </h2>
          </div>

          {/* Score Card - FIXED: Score moved to left and made bold green */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Left side - Score (now on left) */}
            <div className="space-y-6">
              <div className="w-full h-[62px] bg-gradient-to-r from-[#F6EDEC] to-white" />
              <div className="w-full h-[62px] bg-gradient-to-r from-[#F6EDEC] to-white max-w-[552px]" />
              <div>
                <span className="text-5xl font-bold text-[#132A13]">Score: {overallScore}</span>
              </div>
            </div>

            {/* Right side - Scanning status */}
            <div className="relative">
              <div className="bg-[#132A13]/10 p-8">
                <h3 className="font-amiri text-[50px] text-black mb-4">
                  Scanning your website...
                </h3>
                <p className="font-amiri text-[20px] text-black">
                  Testing your website for accessibility requirements with recommendations on where to adapt
                </p>
              </div>
            </div>
          </div>

          {/* Severity Scale */}
          <div className="grid grid-cols-4 gap-4 mb-12 max-w-3xl">
            <div className="text-center">
              <div className="bg-red-100 text-red-800 border border-red-300 rounded-lg p-3 mx-auto mb-2">
                <div className="text-xl font-bold">95%</div>
                <div className="text-sm">Critical</div>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 text-orange-800 border border-orange-300 rounded-lg p-3 mx-auto mb-2">
                <div className="text-xl font-bold">75%</div>
                <div className="text-sm">Serious</div>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-lg p-3 mx-auto mb-2">
                <div className="text-xl font-bold">50%</div>
                <div className="text-sm">Moderate</div>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 text-blue-800 border border-blue-300 rounded-lg p-3 mx-auto mb-2">
                <div className="text-xl font-bold">25%</div>
                <div className="text-sm">Minor</div>
              </div>
            </div>
          </div>

          {/* Evaluation Categories - Following Figma layout */}
          <div className="space-y-8">
            {Object.entries(issuesByCategory)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([category, issues], categoryIndex) => (
                <div key={category} className="bg-white shadow-[3px_3px_20px_rgba(0,0,0,0.20)] rounded-2xl overflow-hidden">
                  {/* Category Header - REMOVED rotated rectangles */}
                  <div 
                    className="bg-[#F6EDEC] p-6 cursor-pointer hover:bg-[#e8dddc] transition"
                    onClick={() => toggleCategory(category)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-3xl text-[#A3493F]">
                          {expandedCategories[category] ? '−' : '+'}
                        </span>
                        <h3 className="font-amiri text-3xl text-black">{category}</h3>
                      </div>
                      <span className="text-2xl font-bold text-[#A3493F]">{issues.length}</span>
                    </div>
                  </div>

                  {/* Issues List */}
                  {expandedCategories[category] && (
                    <div className="divide-y divide-gray-200">
                      {issues.map((issue, idx) => {
                        const issueId = `${category}-${idx}`;
                        const severityPercentage = getSeverityPercentage(issue.type);
                        const severityColor = getSeverityColor(severityPercentage);
                        const title = getIssueTitle(issue);
                        const affectedUsers = getAffectedUsers(issue);
                        const { version, criterion, level } = getWCAGInfo(issue);

                        return (
                          <div key={idx} className="border-t border-[#A44A3F]/20">
                            {/* Issue Header */}
                            <div 
                              className="p-6 cursor-pointer hover:bg-gray-50 transition flex items-start gap-4"
                              onClick={() => toggleIssue(issueId)}
                            >
                              <span className="text-2xl text-gray-400">
                                {expandedIssues[issueId] ? '−' : '+'}
                              </span>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-semibold text-lg text-gray-900">
                                    {title}
                                  </h4>
                                  <div className={`flex items-center gap-1 px-3 py-1 rounded-full border ${severityColor}`}>
                                    <span className="font-bold">{severityPercentage}</span>
                                    <span className="text-xs">Severity</span>
                                  </div>
                                </div>
                                {!expandedIssues[issueId] && (
                                  <div className="flex flex-wrap gap-2">
                                    {affectedUsers.slice(0, 2).map((user, i) => (
                                      <span key={i} className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                        {user}
                                      </span>
                                    ))}
                                    {affectedUsers.length > 2 && (
                                      <span className="text-sm text-gray-500">+{affectedUsers.length - 2} more</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Expanded Issue Details */}
                            {expandedIssues[issueId] && (
                              <div className="p-6 bg-gray-50 border-t border-[#A44A3F]/20">
                                <div className="space-y-6">
                                  {/* WCAG Info */}
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h5 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                                      <span>📋</span>
                                      Accessibility Standard
                                    </h5>
                                    <div className="flex flex-wrap items-center gap-3">
                                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                        version === 'ARIA' 
                                          ? 'bg-purple-600 text-white' 
                                          : 'bg-blue-600 text-white'
                                      }`}>
                                        {version}
                                      </span>
                                      {criterion && (
                                        <span className="bg-white text-blue-800 px-3 py-1 rounded-full text-sm border border-blue-300">
                                          {criterion}
                                        </span>
                                      )}
                                      {level && version !== 'ARIA' && (
                                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm border border-purple-300">
                                          Level {level}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Issue Description */}
                                  <div>
                                    <h5 className="font-semibold text-gray-900 mb-2">What's the issue?</h5>
                                    <p className="text-gray-700">{issue.message}</p>
                                  </div>

                                  {/* Affected Users */}
                                  {affectedUsers.length > 0 && (
                                    <div>
                                      <h5 className="font-semibold text-gray-900 mb-2">Who it affects</h5>
                                      <div className="flex flex-wrap gap-2">
                                        {affectedUsers.map((user, i) => (
                                          <span key={i} className="bg-white border border-gray-200 px-3 py-1 rounded-full text-sm">
                                            {user}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Element Example */}
                                  {issue.context && (
                                    <div>
                                      <h5 className="font-semibold text-gray-900 mb-2">Element found</h5>
                                      <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
                                        {issue.context}
                                      </pre>
                                    </div>
                                  )}

                                  {/* How to Fix */}
                                  {issue.recommendation && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                      <h5 className="font-semibold text-yellow-800 mb-2">How to fix</h5>
                                      <p className="text-yellow-800">{issue.recommendation}</p>
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
              ))}
          </div>

          {/* Download Report Button */}
          <div className="mt-12 text-center">
            <button
              onClick={() => setShowEmailModal(true)}
              className="bg-[#132A13] hover:bg-[#1a3a1a] text-white px-12 py-4 rounded-lg font-semibold text-lg transition-colors inline-flex items-center gap-2"
            >
              📄 Download Complete Report
            </button>
          </div>
        </div>
      </div>

      {/* Email Modal */}
      <EmailOptInModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onConfirm={handleDownloadReport}
      />

      <Footer />
    </div>
  );
}