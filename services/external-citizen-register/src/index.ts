import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { routes } from "./routes";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(cors({
    origin: process.env.CORS_ORIGINS.split(','),
}));

routes(app);

const SERVER_PORT = Number(process.env.SERVER_PORT);
app.listen(SERVER_PORT, () => {
    console.log(`
SERVER STARTED
Now listening to port ${SERVER_PORT}...`)
});