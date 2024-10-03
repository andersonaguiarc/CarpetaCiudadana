import dotenv from 'dotenv';
dotenv.config();

export const mailhogConfig = {
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT)
};
