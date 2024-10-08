import express from 'express';
import {Request, Response} from 'express';
import database from "./utils/database";
import cookieParser from 'cookie-parser'
import authRouter from './routes/auth';
import adminRouter from "./routes/admin";
import userRouter from "./routes/user";
import ticketsRouter from "./routes/tickets";
import fetchRouter from "./routes/fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(cookieParser());

app.use('/auth', authRouter)
app.use('/admin', adminRouter)
app.use('/user', userRouter)
app.use('/tickets', ticketsRouter)
app.use('/fetch', fetchRouter)

// app.get('/users', (req: Request, res: Response) => {
//     database.getConnection(function(err, connection) {
//         if (err) {
//             console.log(err);
//             return res.status(500).send({
//                 status: 500,
//                 success: false,
//                 message: err.message,
//             })
//         }
//
//         connection.query("SELECT * FROM users", function (err, results) {
//             if (err) {
//                 connection.release()
//                 return res.status(400).send({
//                     status: 400,
//                     success: false
//                 })
//             }
//
//             res.status(200).send({
//                 status: 200,
//                 success: true,
//                 results,
//             })
//
//             connection.release();
//         })
//     })
// })


app.get('/users/:id', (req: Request, res: Response) => {
    database.getConnection(function(err, connection) {
        if (err) {
            console.log(err);
            return res.status(500).send({
                status: 500,
                success: false,
                message: err.message,
            })
        }

        connection.query("SELECT * FROM users WHERE user_id=?", [req.params.id], function (err, results) {
            if (err) {
                connection.release()
                return res.status(400).send({
                    status: 400,
                    success: false
                })
            }

            res.status(200).send({
                status: 200,
                success: true,
                results,
            })

            connection.release();
        })
    })
})

app.listen(3000, () => {
    console.log('The application is listening on port 3000!');
})