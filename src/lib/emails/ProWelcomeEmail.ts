export const getProWelcomeEmailHtml = (name: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f9f9fa;
      color: #1a1a1a;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 16px;
      border: 1px solid #eaeaea;
      padding: 40px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.03);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      width: 48px;
      height: 48px;
      background-color: #1559EF;
      border-radius: 12px;
      display: inline-block;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 24px;
      font-weight: 700;
      margin: 0 0 10px 0;
      color: #111111;
    }
    p {
      font-size: 15px;
      line-height: 1.6;
      color: #444444;
      margin: 0 0 20px 0;
    }
    .features {
      background-color: #f8fafc;
      border-radius: 12px;
      padding: 24px;
      margin: 30px 0;
    }
    .features h3 {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin: 0 0 20px 0;
    }
    .feature-item {
      margin-bottom: 16px;
    }
    .feature-item h4 {
      font-size: 15px;
      margin: 0 0 4px 0;
      color: #111111;
    }
    .feature-item p {
      font-size: 14px;
      color: #64748b;
      margin: 0;
    }
    .button {
      display: inline-block;
      background-color: #1559EF;
      color: #ffffff !important;
      font-weight: 600;
      font-size: 15px;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 12px;
      text-align: center;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      font-size: 13px;
      color: #888888;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo"></div>
      <h1>Welcome to Deylon Pro</h1>
    </div>
    <p>Hi ${name || 'there'},</p>
    <p>Congratulations! Your upgrade was successful. Deylon's advanced coaching engine is now fully unlocked and ready to help you hit your goals with precision.</p>
    
    <div class="features">
      <h3>What you've unlocked</h3>
      
      <div class="feature-item">
        <h4>21-Day Sprint & Beyond</h4>
        <p>Full access to the complete 21-day program and ongoing continuous support.</p>
      </div>
      
      <div class="feature-item">
        <h4>Top Tier Frameworks</h4>
        <p>Advanced behavioral psychology and world-class habit frameworks applied to your specific goal.</p>
      </div>
      
      <div class="feature-item">
        <h4>Proactive AI Coaching on WhatsApp</h4>
        <p>Highly personalized check-ins and strategy sessions directly on WhatsApp.</p>
      </div>
    </div>
    
    <div style="text-align: center; margin-top: 40px;">
      <a href="https://www.getdeylon.com/dashboard" class="button">Go to Dashboard</a>
    </div>
    
    <div class="footer">
      <p>If you have any questions, simply reply to this email. We're here to help.</p>
      <p>&copy; ${new Date().getFullYear()} Deylon. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;
