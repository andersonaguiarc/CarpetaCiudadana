import dotenv from 'dotenv';
dotenv.config();

export const serviceAccount = {
  type                       : "service_account",
  auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
  auth_uri                   : process.env.AUTH_URI,
  client_email               : process.env.FB_CLIENT_EMAIL,
  client_id                  : process.env.FB_CLIENT_ID,
  client_x509_cert_url       : process.env.CLIENT_X509_CERT_URL,
  private_key                : process.env.FB_PRIVATE_KEY,
  private_key_id             : process.env.FB_PRIVATE_KEY_ID,
  project_id                 : process.env.FB_PROJECT_ID,
  token_uri                  : process.env.TOKEN_URI,
  universe_domain            : process.env.UNIVERSE_DOMAIN,
};

console.log(serviceAccount);