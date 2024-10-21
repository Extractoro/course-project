import {Request, Response, Router} from "express"
import bcrypt from "bcrypt";
import jwt, {JwtPayload} from "jsonwebtoken";
import dotenv from "dotenv";
import {getConnection} from "../utils/database";
import controllersWrapper from "../helpers/controllersWrapper";
import {v4 as uuidv4} from 'uuid';
import transporter from "../utils/emailSender";
import authMiddleware from "../middlewares/authMiddleware";
import {PoolConnection} from "mysql";

dotenv.config();
const router = Router();

router.post('/registration', controllersWrapper(async (req: Request, res: Response) => {
    let connection: PoolConnection | null = null;

    try {
        connection = await getConnection();

        const { email, firstName, lastName, password, phone } = req.body;

        const sqlSelect = 'SELECT * FROM users WHERE email = ?';
        const [existingUser] = await new Promise<any[]>((resolve, reject) => {
            connection!.query(sqlSelect, [email], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });

        if (existingUser.length > 0) {
            return res.status(400).send({
                status: 400,
                success: false,
                message: 'User with this email already exists.',
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = uuidv4();
        const resetPasswordToken = uuidv4();

        const sqlInsert = `INSERT INTO users (user_firstname, user_lastname, email, password, phone, verificationToken, resetPasswordToken) 
                           VALUES (?, ?, ?, ?, ?, ?, ?)`;

        await new Promise<void>((resolve, reject) => {
            connection!.query(sqlInsert, [
                firstName,
                lastName,
                email,
                hashedPassword,
                phone || null,
                verificationToken,
                resetPasswordToken
            ], (err) => {
                if (err) return reject(err);
                resolve();
            });
        });

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
                            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
                            .container { width: 100%; padding: 20px; background-color: #f4f4f4; }
                            .content { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
                            .header { text-align: center; margin-bottom: 20px; }
                            .header h1 { color: #333; }
                            .button { display: inline-block; color: white !important; background-color: #1abc9c; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-size: 16px; transition: background-color 0.8s ease; }
                            .button:hover { background-color: #16a085; }
                            .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="content">
                                <div class="header">
                                    <h1>Confirm Your Email Address</h1>
                                </div>
                                <p>Hello, ${firstName} ${lastName}!</p>
                                <p>Thank you for registering with <strong>EventNest</strong>. To complete the registration process and activate your account, please confirm your email address by clicking the button below.</p>
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
                    </html>`
        });

        res.status(200).send({
            status: 200,
            success: true,
            message: 'Successfully registered. Now confirm your email!',
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

router.get("/registration_confirm/:verificationToken", controllersWrapper(async (req: Request, res: Response) => {
    let connection: PoolConnection | null = null;

    try {
        connection = await getConnection();
        const { verificationToken } = req.params;

        const sqlSelect = `SELECT user_firstname, user_lastname, email FROM users WHERE verificationToken = ? AND verify = 0`;
        const [rows]: any = await new Promise((resolve, reject) => {
            connection!.query(sqlSelect, [verificationToken], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });

        if (!rows) {
            return res.status(400).send({
                status: 400,
                success: false,
                message: "Something went wrong or you are already verified. Please write to support!",
            });
        }

        const sqlUpdate = `UPDATE users SET verify = 1, verificationToken = NULL WHERE verificationToken = ? AND verify = 0`;
        await new Promise((resolve, reject) => {
            connection!.query(sqlUpdate, [verificationToken], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });

        const { user_firstname, user_lastname, email } = rows;

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
                    </html>`,
        });

        res.status(200).send({
            status: 200,
            success: true,
            message: 'Successfully verified. Thank you for being with us!',
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({
            status: 500,
            success: false,
            message: 'Internal Server Error',
        });
    } finally {
        if (connection) connection.release();
    }
}));

router.post("/confirmation_resend", controllersWrapper(async (req: Request, res: Response) => {
    let connection: PoolConnection | null = null;

    try {
        connection = await getConnection();
        const { email: emailReceiver } = req.body;

        const sqlSelect = `SELECT user_firstname, user_lastname, email, verificationToken
                           FROM users
                           WHERE email = ?
                             AND verify = 0`;
        
        const [rows] = await new Promise<any[]>((resolve, reject) => {
            connection!.query(sqlSelect, [emailReceiver], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });

        if (!rows) {
            return res.status(400).send({
                status: 400,
                success: false,
                message: "No unverified user found with this email address. Please write to support!",
            });
        }

        const { user_firstname, user_lastname, email, verificationToken } = rows;

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
                </html>`,
        });

        res.status(200).send({
            status: 200,
            success: true,
            message: 'Successfully sent. Now confirm your email!',
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

router.post("/forget_password", controllersWrapper(async (req: Request, res: Response) => {
    let connection: PoolConnection | null = null;

    try {
        connection = await getConnection();

        const { email: emailReceiver } = req.body;

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

        const [rows] = await new Promise<any[]>((resolve, reject) => {
            connection!.query(sqlSelect, [emailReceiver], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });

        if (!rows) {
            return res.status(400).send({
                status: 400,
                success: false,
                message: "Something went wrong or you have not even registered yet. Please write to support!",
            });
        }

        const { user_firstname, user_lastname, email, resetPasswordToken } = rows;

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
        });

        res.status(200).send({
            status: 200,
            success: true,
            message: 'Successfully sent. You can change your password!',
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

router.post("/reset_password/:resetPasswordToken", controllersWrapper(async (req: Request, res: Response) => {
    const { resetPasswordToken } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
        return res.status(400).send({
            status: 400,
            success: false,
            message: "New password is required.",
        });
    }

    let connection: PoolConnection | null = null;

    try {
        connection = await getConnection();

        const sqlUpdate = `UPDATE users
                           SET password = ?
                           WHERE resetPasswordToken = ?`;

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        if (!hashedPassword) {
            return res.status(500).send({
                status: 500,
                success: false,
                message: "Something went wrong while hashing the password. Please write to support!",
            });
        }

        const result = await new Promise<any>((resolve, reject) => {
            connection!.query(sqlUpdate, [hashedPassword, resetPasswordToken], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });

        if (result.affectedRows === 0) {
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

    } catch (err) {
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

router.post('/login', controllersWrapper(async (req: Request, res: Response) => {
    let connection: PoolConnection | null = null;

    try {
        connection = await getConnection(); // Получаем соединение

        const sqlQuery = `SELECT user_firstname, user_lastname, email, password, role
                          FROM users
                          WHERE verify = 1
                            AND email = ?`;
        const { email, password } = req.body;

        const [rows] = await new Promise<any[]>((resolve, reject) => {
            connection!.query(sqlQuery, [email], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });

        if (!rows) {
            return res.status(404).send({
                status: 404,
                success: false,
                message: 'User not found or not verified.',
            });
        }

        const { user_firstname, user_lastname, password: hash, role } = rows;

        const isPasswordValid = await bcrypt.compare(password, hash);
        if (!isPasswordValid) {
            return res.status(401).send({
                status: 401,
                success: false,
                message: 'Invalid credentials',
            });
        }

        const token = jwt.sign(
            { user_firstname, user_lastname, email },
            process.env.JWT_SECRET as string,
            { expiresIn: process.env.EXPIRESIN }
        );

        res.status(200).send({
            status: 200,
            success: true,
            message: 'Success',
            results: { token, role },
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