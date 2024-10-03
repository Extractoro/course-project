import express, {Request, Response} from "express"
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import database from "../utils/database";
import controllersWrapper from "../helpers/controllersWrapper";

dotenv.config();
const router = express.Router();

router.post('/registration', controllersWrapper((req: Request, res: Response) => {
    database.getConnection(async function(err, connection) {
        if (err) {
            console.log(err);
            return res.status(500).send({
                status: 500,
                success: false,
                message: err.message,
            })
        }

        let sqlQuery = `CALL registrationUser(?, ?, ?, ?, ?)`;
        const {firstName, lastName, email, password, phone} = req.body

        const hashedPassword = await bcrypt.hash(password, 10);

        connection.query(sqlQuery, [firstName, lastName, email, hashedPassword, phone || null],function (err, results) {
            if (err) {
                connection.release();
                return res.status(400).send({
                    status: 400,
                    success: false,
                    message: err.message,
                })
            }

            res.status(200).send({
                status: 200,
                success: true,
                message: 'User successfully registered',
            })
        })
    })
}))

router.post('/login', controllersWrapper((req: Request, res: Response) => {
    database.getConnection( function(err, connection) {
        if (err) {
            console.log(err);
            return res.status(500).send({
                status: 500,
                success: false,
                message: err.message,
            })
        }

        let sqlQuery = `SELECT user_firstname, user_lastname, email, password FROM users WHERE email = ?`;
        const {email, password} = req.body

        connection.query(sqlQuery, [email], function (err, rows) {
            if (err) {
                connection.release();
                return res.status(400).send({
                    status: 400,
                    success: false,
                    message: err.message,
                })
            }

            const { user_firstname, user_lastname, email } = rows[0];
            const hash = rows[0].password;

            bcrypt.compare(password, hash, (err, result) => {
                if (err) {
                    return res.status(500).send({
                        status: 500,
                        success: false,
                        message: err.message,
                    })
                }

                if (result) {
                    res.status(200).send({
                        status: 200,
                        success: true,
                        message: 'Success',
                        results: { token: jwt.sign({user_firstname, user_lastname, email}, process.env.JWT_SECRET as string, { expiresIn: process.env.EXPIRESIN }) }
                    })
                } else {
                    return res.status(500).send({
                        status: 500,
                        success: false,
                        message: err,
                    })
                }
            })
        })
    })
}))


export default router;