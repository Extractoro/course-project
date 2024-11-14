import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser'
import authRouter from './routes/auth';
import adminRouter from "./routes/admin";
import userRouter from "./routes/user";
import ticketsRouter from "./routes/tickets";
import fetchRouter from "./routes/fetch";
import dotenv from "dotenv";
import morgan from "morgan";
import {setupRecurringEventCron} from "./utils/cronJobs";

dotenv.config();

const app = express();
const allowedOrigins = ['https://course-project-extractoro.netlify.app', 'http://localhost:5173'];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
}));

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('tiny'));

setupRecurringEventCron()

app.use('/auth', authRouter)
app.use('/admin', adminRouter)
app.use('/user', userRouter)
app.use('/tickets', ticketsRouter)
app.use('/fetch', fetchRouter)

app.listen(process.env.PORT || 8080, () => {
    console.log(`The application is listening on port ${process.env.PORT || 8080}!`);
})