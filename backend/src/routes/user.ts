import dotenv from "dotenv";
import {Request, Response, Router} from "express";
import authMiddleware from "../middlewares/authMiddleware";
import controllersWrapper from "../helpers/controllersWrapper";
import transporter from "../utils/emailSender";
import bcrypt from "bcrypt";
import database from "../utils/database";
import { v4 as uuidv4 } from 'uuid';
import jwt, {JwtPayload} from "jsonwebtoken";

dotenv.config();
const router = Router();

router.use(authMiddleware)

router.get("/current", controllersWrapper((req: Request, res: Response) => {
    database.getConnection( function(err, connection) {
        const token = req.cookies?.token;
        const decoded = jwt.decode(token) as JwtPayload;

        if (!decoded || typeof decoded === 'string' || !decoded.email) {
            return res.status(401).send({
                status: 401,
                success: false,
                message: 'Invalid token!',
            });
        }

        const sqlQuery = `SELECT user_id, user_firstname, user_lastname, email, phone, role, verify FROM users WHERE email = ?`;

        connection.query(sqlQuery, [decoded?.email], function (err, rows) {
            if (err) {
                return res.status(400).send({
                    status: 400,
                    success: false,
                    message: err.message,
                });
            }

            return res.status(200).send({
                status: 200,
                success: true,
                results: rows,
            });
        })
    })
}))

router.put("/update_user/:id", controllersWrapper(async (req: Request, res: Response) => {
    const user_id: number = Number(req.params.id);

    if (isNaN(user_id)) {
        return res.status(400).send({ status: 400, success: false, message: 'Invalid user ID' });
    }

    const { firstname, lastname, phone, email, password } = req.body;

    const getUserQuery = `SELECT email FROM users WHERE user_id = ?`;

    database.getConnection(function (err, connection) {
        if (err) {
            return res.status(500).send({
                status: 500,
                success: false,
                message: err.message,
            });
        }

        connection.query(getUserQuery, [user_id], async function (err, result) {
            if (err) {
                return res.status(500).send({
                    status: 500,
                    success: false,
                    message: err.message,
                });
            }

            const oldEmail = result[0]?.email;
            const emailChanged = oldEmail !== email;

            let verificationToken = null;
            if (emailChanged) {
                verificationToken = uuidv4();
            }

            let hashedPassword: string | null = null;
            if (password) {
                const saltRounds = 10;
                hashedPassword = await bcrypt.hash(password, saltRounds);
            }

            const updateUserQuery = `UPDATE users
                                     SET user_firstname = ?, user_lastname = ?, email = ?, phone = ?, password = COALESCE(?, password), verificationToken = COALESCE(?, verificationToken), verify = ?
                                     WHERE user_id = ?`;

            connection.query(updateUserQuery, [firstname, lastname, email, phone, hashedPassword, verificationToken, emailChanged ? 0 : 1, user_id], async function (err, result) {
                if (err) {
                    return res.status(500).send({
                        status: 500,
                        success: false,
                        message: err.message,
                    });
                }

                if ((result as any).affectedRows === 0) {
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
                        <meta http-equiv="X-UA-Compatible" content="IE=edge">
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
                        <div class="container">
                           <div class="content">
                              <div class="header">
                                 <h1>Confirm Your New Email Address</h1>
                              </div>
                              <p>Hello, ${firstname} ${lastname}!</p>
                              <p>It looks like you've changed your email for your <strong>EventNest</strong> account. Please confirm your new email address by clicking the button below.</p>
                              <div style="text-align: center; margin: 20px 0;">
                                 <a href="http://localhost:3000/auth/registration_confirm/${verificationToken}" class="button">Confirm Email</a>
                              </div>
                              <p>If the button doesn't work, copy and paste the following URL into your browser's address bar:</p>
                              <p>http://localhost:3000/auth/registration_confirm/${verificationToken}</p>
                              <p>If you did not request this change, please contact support immediately.</p>
                              <p>Best regards,<br>The EventNest Team</p>
                           </div>
                           <div class="footer">
                              <p>&copy; 2024 EventNest. All rights reserved.</p>
                           </div>
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
            });
        });
    });
}));

export default router;