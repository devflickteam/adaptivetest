// pages/api/send-email.js
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, subject, text, html } = req.body;

    // Validate required fields
    if (!to || !subject || !text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Email configuration
    const emailConfig = {
      host: process.env.EMAIL_HOST || 'smtp.dreamhost.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    };

    // Create transporter - USING LET (NOT CONST)
    let transporter = nodemailer.createTransport(emailConfig);

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
          port: 465,
          secure: true,
        };
        
        const altTransporter = nodemailer.createTransport(altConfig);
        await altTransporter.verify();
        console.log('✅ Connected via smtp.dreamhost.com');
        
        // Reassign to the existing transporter variable
        transporter = altTransporter;
      } else {
        throw verifyError;
      }
    }

    // Send email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@adaptivetest.com',
      to,
      subject,
      text,
      html: html || text,
    });

    console.log('✅ Email sent:', info.messageId);
    
    return res.status(200).json({ 
      success: true, 
      messageId: info.messageId 
    });

  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return res.status(500).json({ 
      error: 'Failed to send email',
      details: error.message 
    });
  }
}
