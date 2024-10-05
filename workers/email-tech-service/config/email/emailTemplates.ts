interface EmailTemplate {
  from: string;
  to: string;
  subject: string;
  html: string;
}

export const CreateNotificationCitizenEmail = (message: any): EmailTemplate => ({
  from: 'no-reply@fastidentify.com',
  to: message.email,
  subject: message.subject,
  html: generateEmailHtml(message.message)
});

const generateEmailHtml = (message: any): string => {
  return `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
          .header {
            background-color: #007bff;
            color: #ffffff;
            padding: 10px 0;
            text-align: center;
          }
          .content {
            padding: 20px;
            font-size: 16px;
            line-height: 1.5;
          }
          .footer {
            text-align: center;
            padding: 10px 0;
            font-size: 12px;
            color: #777777;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Notification</h1>
          </div>
          <div class="content">
            ${message}
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} FastIdentify. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;
};
