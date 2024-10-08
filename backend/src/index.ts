import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser'
import authRouter from './routes/auth';
import adminRouter from "./routes/admin";
import userRouter from "./routes/user";
import ticketsRouter from "./routes/tickets";
import fetchRouter from "./routes/fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(cookieParser());

app.use('/auth', authRouter)
app.use('/admin', adminRouter)
app.use('/user', userRouter)
app.use('/tickets', ticketsRouter)
app.use('/fetch', fetchRouter)

app.listen(3000, () => {
    console.log('The application is listening on port 3000!');
})