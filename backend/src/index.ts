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
app.use(cors({
    origin: `${process.env.CLIENT_URL}`,
    credentials: true,
}));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(cookieParser());

app.use('/auth', authRouter)
app.use('/admin', adminRouter)
app.use('/user', userRouter)
app.use('/tickets', ticketsRouter)
app.use('/fetch', fetchRouter)

app.listen(process.env.PORT || 8080, () => {
    console.log(`The application is listening on port ${process.env.PORT || 8080}!`);
})