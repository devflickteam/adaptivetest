// pages/api/send-email.js - DREAMHOST SPECIFIC
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, company, type, agreeToNewsletter, overallScore } = req.body;

    // DREAMHOST SPECIFIC CONFIGURATION
    const emailConfig = {
      host: process.env.EMAIL_HOST || 'smtp.dreamhost.com',
      port: parseInt(process.env.EMAIL_PORT) || 465, // DreamHost: 465 for SSL, 587 for TLS
      secure: process.env.EMAIL_SECURE === 'true', // true for SSL (465), false for TLS (587)
      auth: {
        user: process.env.EMAIL_USER || 'adaptivetest@adaptiveatelier.com',
        pass: process.env.EMAIL_PASSWORD,
      },
      // Important for DreamHost
      tls: {
        // If you're using a self-signed certificate on DreamHost
        rejectUnauthorized: false, // Set to true in production with valid SSL
      },
      // Connection timeout
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 10000,
    };

    console.log('DreamHost Email Configuration:', {
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure ? 'SSL' : 'TLS',
      user: emailConfig.auth.user,
    });

    // Create transporter
    const transporter = nodemailer.createTransport(emailConfig);

    // Verify connection
    try {
      await transporter.verify();
      console.log('✅ DreamHost email connection verified');
    } catch (verifyError) {
      console.error('❌ DreamHost email connection failed:', verifyError.message);
      
      // Try alternative DreamHost SMTP server
      if (emailConfig.host === 'smtp.dreamhost.com') {
        console.log('Trying alternative DreamHost SMTP server...');
        
        const altConfig = {
          ...emailConfig,
          host: 'smtp.dreamhost.com',
          port: 465, // DreamHost's main SMTP
        };
        
        const altTransporter = nodemailer.createTransport(altConfig);
        await altTransporter.verify();
        console.log('✅ Connected via smtp.dreamhost.com');
        
        // Use alternative transporter
        transporter = altTransporter;
      } else {
        throw verifyError;
      }
    }

    if (type === 'report_request') {
      // Email to Adaptive Atelier
      const mailOptionsToAdaptive = {
        from: process.env.EMAIL_FROM || `"AdaptiveTest AI" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_TO || process.env.EMAIL_USER,
        subject: '🎯 New Accessibility Report Request - AdaptiveTest AI',
        html: generateAdaptiveEmailHTML(name, email, company, agreeToNewsletter, overallScore),
        // DreamHost often requires these headers
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'high'
        }
      };

      const adaptiveResult = await transporter.sendMail(mailOptionsToAdaptive);
      console.log('✅ Email sent to Adaptive Atelier:', adaptiveResult.messageId);
    }

    if (type === 'report_confirmation') {
      // Email to user
      const mailOptionsToUser = {
        from: process.env.EMAIL_FROM || `"Adaptive Atelier" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `✅ Your Accessibility Report (Score: ${overallScore}%) - Adaptive Atelier`,
        html: generateUserEmailHTML(name, email, company, overallScore),
        // Attach PDF if you want to send it directly (alternative to download)
        // attachments: [{
        //   filename: `AdaptiveTest-Accessibility-Report-${Date.now()}.pdf`,
        //   content: pdfBuffer, // You would generate this
        //   contentType: 'application/pdf'
        // }]
      };

      const userResult = await transporter.sendMail(mailOptionsToUser);
      console.log('✅ Confirmation email sent to user:', userResult.messageId);
    }

    res.status(200).json({ 
      success: true,
      message: 'Emails sent successfully'
    });

  } catch (error) {
    console.error('❌ Email sending error:', error);
    
    // Provide helpful error messages for DreamHost
    let errorMessage = 'Failed to send email';
    let details = undefined;
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Authentication failed. Please check your email credentials.';
      details = 'Verify your DreamHost email username and password.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Connection to DreamHost mail server failed.';
      details = 'Check your SMTP settings: host, port, and secure configuration.';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Connection to DreamHost mail server timed out.';
      details = 'DreamHost mail server might be experiencing issues. Try again later.';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? (details || error.message) : undefined,
      code: error.code
    });
  }
}

// Helper function to generate Adaptive Atelier email HTML
function generateAdaptiveEmailHTML(name, email, company, agreeToNewsletter, overallScore) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
        line-height: 1.6; 
        color: #333; 
        max-width: 600px; 
        margin: 0 auto; 
        padding: 20px; 
        background-color: #f9f9f9;
      }
      .header { 
        background: linear-gradient(135deg, #132A13 0%, #2d5a2d 100%); 
        color: white; 
        padding: 30px; 
        text-align: center; 
        border-radius: 10px 10px 0 0;
      }
      .content { 
        background: white; 
        padding: 30px; 
        border-radius: 0 0 10px 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
      .score-badge {
        background: #132A13;
        color: white;
        padding: 15px;
        border-radius: 8px;
        text-align: center;
        font-size: 24px;
        font-weight: bold;
        margin: 20px 0;
      }
      .details-table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
        background: #f8f9fa;
        border-radius: 8px;
        overflow: hidden;
      }
      .details-table td {
        padding: 12px 15px;
        border-bottom: 1px solid #e9ecef;
      }
      .details-table tr:last-child td {
        border-bottom: none;
      }
      .cta-button {
        display: inline-block;
        background: #132A13;
        color: white;
        padding: 14px 28px;
        text-decoration: none;
        border-radius: 6px;
        font-weight: bold;
        margin-top: 20px;
        transition: background 0.3s;
      }
      .cta-button:hover {
        background: #1a3a1a;
      }
      .footer {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #e9ecef;
        text-align: center;
        color: #6c757d;
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">Adaptive Atelier</h1>
      <p style="margin: 10px 0 0; opacity: 0.9; font-size: 16px;">Accessibility Report Request</p>
    </div>
    
    <div class="content">
      <h2 style="color: #132A13; margin-top: 0;">New Lead Generated</h2>
      
      <div class="score-badge">
        Accessibility Score: ${overallScore || 'N/A'}%
      </div>
      
      <p>You have received a new accessibility report request from AdaptiveTest AI.</p>
      
      <table class="details-table">
        <tr>
          <td><strong>👤 Name:</strong></td>
          <td>${name}</td>
        </tr>
        <tr>
          <td><strong>📧 Email:</strong></td>
          <td><a href="mailto:${email}" style="color: #132A13;">${email}</a></td>
        </tr>
        <tr>
          <td><strong>🏢 Company:</strong></td>
          <td>${company || 'Not provided'}</td>
        </tr>
        <tr>
          <td><strong>📢 Newsletter Opt-in:</strong></td>
          <td>${agreeToNewsletter ? '✅ Yes' : '❌ No'}</td>
        </tr>
        <tr>
          <td><strong>🕒 Request Time:</strong></td>
          <td>${new Date().toLocaleString()}</td>
        </tr>
      </table>
      
      <div style="text-align: center;">
        <a href="mailto:${email}" class="cta-button">
          Reply to ${name.split(' ')[0]}
        </a>
      </div>
    </div>
    
    <div class="footer">
      <p style="margin: 0;">
        <strong>Adaptive Atelier</strong><br>
        Making the web accessible for everyone
      </p>
      <p style="margin: 10px 0 0; font-size: 11px;">
        © ${new Date().getFullYear()} Adaptive Atelier. All rights reserved.<br>
        <a href="https://adaptiveatelier.com" style="color: #132A13; text-decoration: none;">adaptiveatelier.com</a>
      </p>
    </div>
  </body>
  </html>
  `;
}

// Helper function to generate user email HTML
function generateUserEmailHTML(name, email, company, overallScore) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
        line-height: 1.6; 
        color: #333; 
        max-width: 600px; 
        margin: 0 auto; 
        padding: 20px; 
        background-color: #f9f9f9;
      }
      .header { 
        background: linear-gradient(135deg, #132A13 0%, #2d5a2d 100%); 
        color: white; 
        padding: 30px; 
        text-align: center; 
        border-radius: 10px 10px 0 0;
      }
      .content { 
        background: white; 
        padding: 30px; 
        border-radius: 0 0 10px 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
      .score-circle {
        width: 120px;
        height: 120px;
        margin: 0 auto 20px;
        border-radius: 50%;
        background: #132A13;
        color: white;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        font-weight: bold;
      }
      .features-list {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        margin: 20px 0;
      }
      .features-list ul {
        margin: 0;
        padding-left: 20px;
      }
      .features-list li {
        margin-bottom: 8px;
      }
      .cta-button {
        display: inline-block;
        background: #132A13;
        color: white;
        padding: 14px 28px;
        text-decoration: none;
        border-radius: 6px;
        font-weight: bold;
        margin: 10px 5px;
        transition: background 0.3s;
      }
      .cta-button:hover {
        background: #1a3a1a;
      }
      .footer {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #e9ecef;
        text-align: center;
        color: #6c757d;
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">Adaptive Atelier</h1>
      <p style="margin: 10px 0 0; opacity: 0.9; font-size: 16px;">Accessibility Excellence</p>
    </div>
    
    <div class="content">
      <h2 style="color: #132A13; margin-top: 0;">Thank You, ${name.split(' ')[0]}!</h2>
      
      <p>Your accessibility report has been generated successfully.</p>
      
      <div class="score-circle">
        <span style="font-size: 32px;">${overallScore}%</span>
        <span style="font-size: 14px; margin-top: 5px;">Accessibility Score</span>
      </div>
      
      <p>The PDF report is now available for download with Adaptive Atelier branding.</p>
      
      <div class="features-list">
        <p style="margin-top: 0; color: #132A13; font-weight: bold;">📊 Your report includes:</p>
        <ul>
          <li>Overall accessibility score: <strong>${overallScore}%</strong></li>
          <li>Detailed issue breakdown by category</li>
          <li>Affected user groups for each issue</li>
          <li>Severity ratings (Critical, Serious, Moderate, Minor)</li>
          <li>Specific HTML elements to fix</li>
          <li>WCAG compliance references</li>
          <li>Professional Adaptive Atelier branding</li>
        </ul>
      </div>
      
      <p><strong>Need professional help implementing these fixes?</strong></p>
      
      <div style="text-align: center;">
        <a href="mailto:info@adaptiveatelier.com" class="cta-button">
          Contact Our Team
        </a>
        <a href="https://adaptiveatelier.com" class="cta-button" style="background: #4a5568;">
          Visit Our Website
        </a>
      </div>
      
      <p style="margin-top: 25px;">Best regards,<br>
      <strong>The Adaptive Atelier Team</strong></p>
    </div>
    
    <div class="footer">
      <p style="margin: 0;">
        <strong>Adaptive Atelier</strong><br>
        Making the web accessible for everyone
      </p>
      <p style="margin: 10px 0 0; font-size: 11px;">
        © ${new Date().getFullYear()} Adaptive Atelier. All rights reserved.<br>
        <a href="https://adaptiveatelier.com" style="color: #132A13; text-decoration: none;">adaptiveatelier.com</a> | 
        <a href="mailto:info@adaptiveatelier.com" style="color: #132A13; text-decoration: none;">info@adaptiveatelier.com</a>
      </p>
    </div>
  </body>
  </html>
  `;
}