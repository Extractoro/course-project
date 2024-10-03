import express, {Request, Response} from "express"
import database from "../utils/database";
import controllersWrapper from "../helpers/controllersWrapper";
import bcrypt from "bcrypt";

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


export default router;