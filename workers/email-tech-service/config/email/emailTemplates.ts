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
  html: message.message
});

