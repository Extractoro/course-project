import dotenv from "dotenv";
import {Request, Response, Router} from "express";
import authMiddleware from "../middlewares/authMiddleware";
import controllersWrapper from "../helpers/controllersWrapper";
import transporter from "../utils/emailSender";
import bcrypt from "bcrypt";
import {getConnection} from "../utils/database";
import { v4 as uuidv4 } from 'uuid';

dotenv.config();
const router = Router();

router.use(authMiddleware)

router.get("/current/:userId", controllersWrapper(async (req: Request, res: Response) => {
    const { userId } = req.params;

    const connection = await getConnection();

    try {

        const sqlQuery = `SELECT user_id, user_firstname, user_lastname, email, phone, role, verify 
                          FROM users WHERE user_id = ?`;

        const [user] = await connection.query<any>(sqlQuery, [userId]);

        if (user && user.length === 0) {
            return res.status(404).send({
                status: 404,
                success: false,
                message: 'User not found!',
            });
        }

        res.status(200).send({
            status: 200,
            success: true,
            results: user,
        });

    } catch (err) {
        console.error(err);
        res.status(500).send({
            status: 500,
            success: false,
            message: 'Internal Server Error',
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
}));

router.put("/update_user/:id", controllersWrapper(async (req: Request, res: Response) => {
    const user_id: number = Number(req.params.id);

    if (isNaN(user_id)) {
        return res.status(400).send({ status: 400, success: false, message: 'Invalid user ID' });
    }

    const { firstname, lastname, phone, email, password } = req.body;

    const connection = await getConnection();

    try {
        const getUserQuery = `SELECT email FROM users WHERE user_id = ?`;
        const [user] = await connection.query<any>(getUserQuery, [user_id]);

        if (user && user.length === 0) {
            return res.status(404).send({
                status: 404,
                success: false,
                message: 'User not found',
            });
        }

        const oldEmail = user[0].email;
        const emailChanged = oldEmail !== email;
        let verificationToken = emailChanged ? uuidv4() : null;

        let hashedPassword: string | null = null;
        if (password) {
            const saltRounds = 10;
            hashedPassword = await bcrypt.hash(password, saltRounds);
        }

        const updateUserQuery = `
            UPDATE users
            SET user_firstname = ?, user_lastname = ?, email = ?, phone = ?, 
                password = COALESCE(?, password), 
                verificationToken = COALESCE(?, verificationToken), 
                verify = ? 
            WHERE user_id = ?
        `;

        const [result] = await connection.query<any>(updateUserQuery, [
            firstname, lastname, email, phone, hashedPassword,
            verificationToken, emailChanged ? 0 : 1, user_id
        ]);

        if (result && result.affectedRows === 0) {
            return res.status(404).send({
                status: 404,
                success: false,
                message: 'User not found',
            });
        }

        if (emailChanged) {
            await transporter.sendMail({
                to: email,
                from: "EventNest <vadym.tytarenko@nure.ua>",
                subject: "Confirm your new email for EventNest",
                html: `
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Email Confirmation - EventNest</title>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                background-color: #f4f4f4;
                                margin: 0;
                                padding: 0;
                            }
                            .container {
                                width: 100%;
                                padding: 20px;
                                background-color: #f4f4f4;
                            }
                            .content {
                                max-width: 600px;
                                margin: 0 auto;
                                background-color: #ffffff;
                                padding: 20px;
                                border-radius: 8px;
                                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                            }
                            .header {
                                text-align: center;
                                margin-bottom: 20px;
                            }
                            .header h1 {
                                color: #333;
                            }
                            .button {
                                display: inline-block;
                                color: white !important; 
                                background-color: #1abc9c; 
                                padding: 10px 20px;
                                text-decoration: none;
                                border-radius: 5px;
                                font-size: 16px;
                                transition: background-color 0.8s ease;
                            }
                            .button:hover {
                                background-color: #16a085;
                            }
                            .footer {
                                text-align: center;
                                margin-top: 20px;
                                color: #777;
                                font-size: 12px;
                            }
                        </style>
                    </head>
                    <body>
                        <div>
                            <p>Hello, ${firstname} ${lastname}!</p>
                            <p>It looks like you've changed your email for your EventNest account. Please confirm your new email address by clicking the button below.</p>
                            <a href="${process.env.CLIENT_URL}/auth/registration_confirm/${verificationToken}" class="button">Confirm Email</a>
                            <p>If the button doesn't work, copy and paste the following URL into your browser's address bar:</p>
                            <p>${process.env.CLIENT_URL}/auth/registration_confirm/${verificationToken}</p>
                            <p>Best regards,<br>The EventNest Team</p>
                        </div>
                    </body>
                    </html>
                `,
            });
        }

        res.status(200).send({
            status: 200,
            success: true,
            message: emailChanged ? 'User updated successfully! Please confirm your new email.' : 'User updated successfully!',
        });

    } catch (err) {
        console.error(err);
        res.status(500).send({
            status: 500,
            success: false,
            message: 'Internal Server Error',
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
}));

export default router;