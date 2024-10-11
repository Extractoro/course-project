import {Request, Response, Router} from "express"
import bcrypt from "bcrypt";
import jwt, {JwtPayload} from "jsonwebtoken";
import dotenv from "dotenv";
import database from "../utils/database";
import controllersWrapper from "../helpers/controllersWrapper";
import {v4 as uuidv4} from 'uuid';
import transporter from "../utils/emailSender";
import authMiddleware from "../middlewares/authMiddleware";

dotenv.config();
const router = Router();

router.post('/registration', controllersWrapper((req: Request, res: Response) => {
    database.getConnection(async function (err, connection) {
        if (err) {
            console.log(err);
            return res.status(500).send({
                status: 500,
                success: false,
                message: err.message,
            })
        }

        const sqlQuery = `CALL registrationUser(?, ?, ?, ?, ?, ?, ?)`;
        const {firstName, lastName, email, password, phone} = req.body

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = uuidv4()
        const resetPasswordToken = uuidv4()

        connection.query(sqlQuery, [firstName, lastName, email, hashedPassword, phone || null, verificationToken, resetPasswordToken], function (err, results) {
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
                message: 'Successfully registered. Now confirm your email!',
            })
        })

        await transporter.sendMail({
            to: email,
            from: "EventNest <vadym.tytarenko@nure.ua>",
            subject: "Confirm your email for EventNest",
            html: `<!DOCTYPE html>
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
                                color: white !important;;
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
                                    <h1>Confirm Your Email Address</h1>
                                </div>
                                <p>Hello, ${firstName} ${lastName}!</p>
                                <p>Thank you for registering with <strong>EventNest</strong> — your portal for booking event tickets. To complete the registration process and activate your account, please confirm your email address by clicking the button below.</p>
                                <div style="text-align: center; margin: 20px 0;">
                                    <a href="${process.env.CLIENT_URL}/auth/registration_confirm/${verificationToken}" class="button">Confirm Email</a>
                                </div>
                                <p>If the button doesn't work, copy and paste the following URL into your browser's address bar:</p>
                                <p>${process.env.CLIENT_URL}/auth/registration_confirm/${verificationToken}</p>
                                <p>If you did not register for EventNest, you can safely ignore this email.</p>
                                <p>Best regards,<br>The EventNest Team</p>
                            </div>
                            <div class="footer">
                                <p>&copy; 2024 EventNest. All rights reserved.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                    `,
        })
    })
}))

router.get("/registration_confirm/:verificationToken", controllersWrapper((req: Request, res: Response) => {
    database.getConnection(function (err, connection) {
        if (err) {
            console.log(err);
            return res.status(500).send({
                status: 500,
                success: false,
                message: err.message,
            })
        }

        const sqlSelect = `SELECT user_firstname, user_lastname, email
                           FROM users
                           WHERE verificationToken = ?
                             AND verify = 0`;
        const sqlUpdate = `UPDATE users
                           SET verify            = 1,
                               verificationToken = NULL
                           WHERE verificationToken = ?
                             AND verify = 0`;

        const {verificationToken} = req.params

        connection.query(sqlSelect, [verificationToken], async function (err, rows) {
            if (err || rows.length === 0) {
                connection.release();
                return res.status(400).send({
                    status: 400,
                    success: false,
                    message: "Something went wrong or you are already verified. Please write to support!",
                })
            }

            connection.query(sqlUpdate, [verificationToken], function (err, results) {
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
                    message: 'Successfully verified. Thank you that you with us!',
                })
            })

            const {user_firstname, user_lastname, email} = rows[0];

            await transporter.sendMail({
                to: email,
                from: "EventNest <vadym.tytarenko@nure.ua>",
                subject: "Confirmation successful for EventNest",
                html: `<!DOCTYPE html>
                        <html lang="en">
                        <head>
                            <meta charset="UTF-8">
                            <meta http-equiv="X-UA-Compatible" content="IE=edge">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Email Verified - EventNest</title>
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
                                    background-color: #1abc9c;
                                    color: white !important;
                                    padding: 10px 20px;
                                    text-decoration: none;
                                    border-radius: 5px;
                                    font-size: 16px;
                                    transition: background-color 0.3s ease;
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
                                        <h1>Thank You for Verifying Your Email!</h1>
                                    </div>
                                    <p>Hello, ${user_firstname} ${user_lastname}!</p>
                                    <p>Your email has been successfully verified. Welcome to <strong>EventNest</strong> — your portal for booking event tickets. Now you can fully enjoy all the features of your account, including browsing events, purchasing tickets, and managing your bookings.</p>
                                    <div style="text-align: center; margin: 20px 0;">
                                        <a href="${process.env.CLIENT_URL}" class="button">Go to EventNest</a>
                                    </div>
                                    <p>Thank you for being a part of EventNest. If you have any questions, feel free to contact our support team.</p>
                                    <p>Best regards,<br>The EventNest Team</p>
                                </div>
                                <div class="footer">
                                    <p>&copy; 2024 EventNest. All rights reserved.</p>
                                </div>
                            </div>
                        </body>
                        </html>
                        `,
            })
        })
    })
}))

router.post("/confirmation_resend", controllersWrapper((req: Request, res: Response) => {
    database.getConnection(function (err, connection) {
        if (err) {
            console.log(err);
            return res.status(500).send({
                status: 500,
                success: false,
                message: err.message,
            })
        }

        const {email: emailReceiver} = req.body;

        const sqlSelect = `SELECT user_firstname, user_lastname, email, verificationToken
                           FROM users
                           WHERE email = ?
                             AND verify = 0`;

        connection.query(sqlSelect, [emailReceiver], async function (err, rows) {
            console.log(rows?.length)
            if (err || rows?.length === 0) {
                connection.release();
                return res.status(400).send({
                    status: 400,
                    success: false,
                    message: "Something went wrong or you are already verified. Please write to support!",
                })
            }

            res.status(200).send({
                status: 200,
                success: true,
                message: 'Successfully sent. Now confirm your email!',
            })

            console.log(rows[0])
            const {user_firstname, user_lastname, email, verificationToken} = rows[0];

            await transporter.sendMail({
                to: email,
                from: "EventNest <vadym.tytarenko@nure.ua>",
                subject: "Confirm your email for EventNest",
                html: `<!DOCTYPE html>
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
                            color: white !important;;
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
                                <h1>Confirm Your Email Address</h1>
                            </div>
                            <p>Hello, ${user_firstname} ${user_lastname}!</p>
                            <p>Thank you for registering with <strong>EventNest</strong> — your portal for booking event tickets. To complete the registration process and activate your account, please confirm your email address by clicking the button below.</p>
                            <div style="text-align: center; margin: 20px 0;">
                                <a href="${process.env.CLIENT_URL}/auth/registration_confirm/${verificationToken}" class="button">Confirm Email</a>
                            </div>
                            <p>If the button doesn't work, copy and paste the following URL into your browser's address bar:</p>
                            <p>${process.env.CLIENT_URL}/auth/registration_confirm/${verificationToken}</p>
                            <p>If you did not register for EventNest, you can safely ignore this email.</p>
                            <p>Best regards,<br>The EventNest Team</p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2024 EventNest. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
                `,
            })
        })
    })
}))

router.post("/forget_password", controllersWrapper((req: Request, res: Response) => {
    database.getConnection(function (err, connection) {
        if (err) {
            console.log(err);
            return res.status(500).send({
                status: 500,
                success: false,
                message: err.message,
            })
        }

        const {email: emailReceiver} = req.body;

        if (!emailReceiver) {
            return res.status(400).send({
                status: 400,
                success: false,
                message: "Email is required.",
            });
        }

        const sqlSelect = `SELECT user_firstname, user_lastname, email, resetPasswordToken
                           FROM users
                           WHERE email = ?`;

        connection.query(sqlSelect, [emailReceiver], async function (err, rows) {
            if (err || rows?.length === 0) {
                connection.release();
                return res.status(400).send({
                    status: 400,
                    success: false,
                    message: "Something went wrong or you have not even registered yet. Please write to support!",
                })
            }

            res.status(200).send({
                status: 200,
                success: true,
                message: 'Successfully sent. You can change your password!',
            })

            const {user_firstname, user_lastname, email, resetPasswordToken} = rows[0];

            await transporter.sendMail({
                to: email,
                from: "EventNest <vadym.tytarenko@nure.ua>",
                subject: "Change your password",
                html: `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta http-equiv="X-UA-Compatible" content="IE=edge">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Reset Password - EventNest</title>
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
                            background-color: #1abc9c;
                            color: white !important;
                            padding: 10px 20px;
                            text-decoration: none;
                            border-radius: 5px;
                            font-size: 16px;
                            transition: background-color 0.3s ease; /* Плавный переход цвета */
                        }
                        .button:hover {
                            background-color: #16a085; /* Темнее при наведении */
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
                                <h1>Reset Your Password</h1>
                            </div>
                            <p>Hello, ${user_firstname} ${user_lastname}!</p>
                            <p>To reset your password, please click the button below:</p>
                            <div style="text-align: center; margin: 20px 0;">
                                <a href="${process.env.CLIENT_URL}/auth/reset_password/${resetPasswordToken}" class="button">Reset Password</a>
                            </div>
                            <p>If you did not request a password reset, please ignore this email.</p>
                            <p>Best regards,<br>The EventNest Team</p>
                        </div>
                    </div>
                </body>
                </html>
                `,
            })
        })
    })
}))

router.post("/reset_password/:resetPasswordToken", controllersWrapper((req: Request, res: Response) => {
    const {resetPasswordToken} = req.params;
    const {newPassword} = req.body;

    if (!newPassword) {
        return res.status(400).send({
            status: 400,
            success: false,
            message: "New password is required.",
        });
    }

    database.getConnection(async function (err, connection) {
        if (err) {
            return res.status(500).send({
                status: 500,
                success: false,
                message: err.message,
            });
        }

        const sqlUpdate = `UPDATE users
                           SET password = ?
                           WHERE resetPasswordToken = ?`;

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        if (!hashedPassword) {
            return res.status(500).send({
                status: 500,
                success: false,
                message: "Something went wrong. Please write to support!",
            });
        }

        connection.query(sqlUpdate, [hashedPassword, resetPasswordToken], function (err, result) {
            connection.release();

            if (err || result.affectedRows === 0) {
                return res.status(400).send({
                    status: 400,
                    success: false,
                    message: "Invalid token or something went wrong.",
                });
            }

            res.status(200).send({
                status: 200,
                success: true,
                message: 'Password has been reset successfully!',
            });
        });
    });
}));

router.post('/login', controllersWrapper((req: Request, res: Response) => {
    database.getConnection(function (err, connection) {
        if (err) {
            console.log(err);
            return res.status(500).send({
                status: 500,
                success: false,
                message: err.message,
            })
        }

        const sqlQuery = `SELECT user_firstname, user_lastname, email, password
                          FROM users
                          WHERE verify = 1
                            AND email = ?`;
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

            if (rows.length === 0) {
                connection.release();
                return res.status(404).send({
                    status: 404,
                    success: false,
                    message: 'User not found or not verified.',
                });
            }

            const {user_firstname, user_lastname, email} = rows[0];
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
                    const token = jwt.sign(
                        {user_firstname, user_lastname, email},
                        process.env.JWT_SECRET as string,
                        {expiresIn: process.env.EXPIRESIN}
                    );

                    res.status(200).send({
                        status: 200,
                        success: true,
                        message: 'Success',
                        results: {token},
                    });
                } else {
                    return res.status(401).send({
                        status: 401,
                        success: false,
                        message: 'Invalid credentials',
                    });
                }
            })
        })
    })
}))

router.use(authMiddleware)

router.get("/logout", controllersWrapper((req: Request, res: Response) => {
    res.status(200).send({
        status: 200,
        success: true,
        message: 'Logged out successfully!',
    });
}))

export default router;