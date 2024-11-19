import {Request, Response, Router} from "express"
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import {getConnection} from "../utils/database";
import controllersWrapper from "../helpers/controllersWrapper";
import {v4 as uuidv4} from 'uuid';
import transporter from "../utils/emailSender";
import authMiddleware from "../middlewares/authMiddleware";

dotenv.config();
const router = Router();

router.post(
    "/registration",
    controllersWrapper(async (req: Request, res: Response) => {
        const { email, firstName, lastName, password, phone } = req.body;

        if (!email || !firstName || !lastName || !password) {
            return res.status(400).send({
                status: 400,
                success: false,
                message: "Missing required fields: email, firstName, lastName, or password.",
            });
        }

        const connection = await getConnection();

        try {
            // Проверка существующего пользователя
            const [existingUser] = await connection.query<any>(
                "SELECT * FROM users WHERE email = ?",
                [email]
            );

            if (existingUser.length > 0) {
                return res.status(400).send({
                    status: 400,
                    success: false,
                    message: "User with this email already exists.",
                });
            }

            // Хэширование пароля и создание токенов
            const hashedPassword = await bcrypt.hash(password, 10);
            const verificationToken = uuidv4();
            const resetPasswordToken = uuidv4();

            // Вставка нового пользователя
            await connection.query(
                `INSERT INTO users (user_firstname, user_lastname, email, password, phone, verificationToken, resetPasswordToken) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    firstName,
                    lastName,
                    email,
                    hashedPassword,
                    phone || null,
                    verificationToken,
                    resetPasswordToken,
                ]
            );

            // Отправка email
            await transporter.sendMail({
                to: email,
                from: "EventNest <vadym.tytarenko@nure.ua>",
                subject: "Confirm your email for EventNest",
                html: `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
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
                </html>`,
            });

            res.status(200).send({
                status: 200,
                success: true,
                message: "Successfully registered. Now confirm your email!",
            });
        } catch (err) {
            console.error(err);
            res.status(500).send({
                status: 500,
                success: false,
                message: "Internal Server Error",
            });
        } finally {
            connection.release();
        }
    })
);

router.get("/registration_confirm/:verificationToken", controllersWrapper(async (req: Request, res: Response) => {
    const { verificationToken } = req.params;

    try {
        const connection = await getConnection();

        const selectUserQuery = `
            SELECT user_firstname, user_lastname, email 
            FROM users 
            WHERE verificationToken = ? AND verify = 0
        `;

        const [rows]: any = await connection.query(selectUserQuery, [verificationToken]);

        if (!rows || rows.length === 0) {
            return res.status(400).send({
                status: 400,
                success: false,
                message: "Something went wrong or you are already verified. Please contact support.",
            });
        }

        const { user_firstname, user_lastname, email } = rows[0];

        const updateUserQuery = `
            UPDATE users 
            SET verify = 1, verificationToken = NULL 
            WHERE verificationToken = ? AND verify = 0
        `;
        await connection.query(updateUserQuery, [verificationToken]);

        await transporter.sendMail({
            to: email,
            from: "EventNest <vadym.tytarenko@nure.ua>",
            subject: "Email Verification Successful - EventNest",
            html: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Email Verified</title>
                    <style>
                        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
                        .container { padding: 20px; max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; }
                        .header h1 { color: #333; }
                        .button { background: #1abc9c; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; }
                        .button:hover { background: #16a085; }
                        .footer { text-align: center; color: #777; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Email Successfully Verified</h1>
                        </div>
                        <p>Hello, ${user_firstname} ${user_lastname}!</p>
                        <p>Thank you for verifying your email. You can now access all the features of EventNest.</p>
                        <p>Click the button below to explore:</p>
                        <p style="text-align: center;">
                            <a href="${process.env.CLIENT_URL}" class="button">Go to EventNest</a>
                        </p>
                        <div class="footer">
                            <p>&copy; 2024 EventNest. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        });

        res.status(200).send({
            status: 200,
            success: true,
            message: "Your email has been successfully verified.",
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({
            status: 500,
            success: false,
            message: "Internal Server Error",
        });
    }
}));

router.post("/confirmation_resend", controllersWrapper(async (req: Request, res: Response) => {
    const { email: emailReceiver } = req.body;

    try {
        const connection = await getConnection();

        const selectQuery = `
            SELECT user_firstname, user_lastname, email, verificationToken
            FROM users
            WHERE email = ?
              AND verify = 0
        `;

        const [rows]: any = await connection.query(selectQuery, [emailReceiver]);

        if (!rows || rows.length === 0) {
            return res.status(400).send({
                status: 400,
                success: false,
                message: "No unverified user found with this email address. Please contact support!",
            });
        }

        const { user_firstname, user_lastname, email, verificationToken } = rows[0];

        await transporter.sendMail({
            to: email,
            from: "EventNest <vadym.tytarenko@nure.ua>",
            subject: "Confirm your email for EventNest",
            html: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Email Confirmation</title>
                    <style>
                        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
                        .container { width: 100%; padding: 20px; background-color: #f4f4f4; }
                        .content { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
                        .header { text-align: center; margin-bottom: 20px; }
                        .header h1 { color: #333; }
                        .button { display: inline-block; background: #1abc9c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
                        .button:hover { background: #16a085; }
                        .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="content">
                            <div class="header">
                                <h1>Confirm Your Email</h1>
                            </div>
                            <p>Hello, ${user_firstname} ${user_lastname}!</p>
                            <p>Thank you for registering with <strong>EventNest</strong>. Please confirm your email by clicking the button below:</p>
                            <div style="text-align: center; margin: 20px;">
                                <a href="${process.env.CLIENT_URL}/auth/registration_confirm/${verificationToken}" class="button">Confirm Email</a>
                            </div>
                            <p>If the button doesn't work, paste this URL in your browser:</p>
                            <p>${process.env.CLIENT_URL}/auth/registration_confirm/${verificationToken}</p>
                            <p>Thank you for being with us!</p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2024 EventNest. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        });

        res.status(200).send({
            status: 200,
            success: true,
            message: "Email resent successfully. Please confirm your email.",
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({
            status: 500,
            success: false,
            message: "Internal Server Error",
        });
    }
}));

router.post("/forget_password", controllersWrapper(async (req: Request, res: Response) => {
    try {
        const connection = await getConnection();
        const { email: emailReceiver } = req.body;

        if (!emailReceiver) {
            return res.status(400).send({
                status: 400,
                success: false,
                message: "Email is required.",
            });
        }

        const selectQuery = `
            SELECT user_firstname, user_lastname, email, resetPasswordToken
            FROM users
            WHERE email = ?
        `;

        const [rows]: any = await connection.query(selectQuery, [emailReceiver]);

        if (!rows || rows.length === 0) {
            return res.status(400).send({
                status: 400,
                success: false,
                message: "No user found with this email. Please contact support!",
            });
        }

        const { user_firstname, user_lastname, email, resetPasswordToken } = rows[0];

        await transporter.sendMail({
            to: email,
            from: "EventNest <vadym.tytarenko@nure.ua>",
            subject: "Reset Your Password",
            html: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Reset Password</title>
                    <style>
                        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
                        .container { width: 100%; padding: 20px; background-color: #f4f4f4; }
                        .content { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
                        .header { text-align: center; margin-bottom: 20px; }
                        .header h1 { color: #333; }
                        .button { display: inline-block; background: #1abc9c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
                        .button:hover { background: #16a085; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="content">
                            <div class="header">
                                <h1>Reset Your Password</h1>
                            </div>
                            <p>Hello, ${user_firstname} ${user_lastname}!</p>
                            <p>To reset your password, click the button below:</p>
                            <div style="text-align: center; margin: 20px;">
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
            message: "Password reset email sent successfully.",
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({
            status: 500,
            success: false,
            message: "Internal Server Error.",
        });
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

    try {
        const connection = await getConnection();

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const updateQuery = `
            UPDATE users
            SET password = ?, resetPasswordToken = NULL
            WHERE resetPasswordToken = ?
        `;

        const [result]: any = await connection.query(updateQuery, [hashedPassword, resetPasswordToken]);

        if (result.affectedRows === 0) {
            return res.status(400).send({
                status: 400,
                success: false,
                message: "Invalid token or no user found.",
            });
        }

        res.status(200).send({
            status: 200,
            success: true,
            message: "Password has been reset successfully!",
        });

    } catch (err) {
        console.error(err);
        res.status(500).send({
            status: 500,
            success: false,
            message: "Internal Server Error.",
        });
    }
}));

router.post('/login', controllersWrapper(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const connection = await getConnection();

    try {

        const sqlQuery = `
            SELECT user_id, user_firstname, user_lastname, email, password, role
            FROM users
            WHERE verify = 1 AND email = ?
        `;

        const [rows] : any = await connection.query(sqlQuery, [email]);

        if (!rows || rows.length === 0) {
            return res.status(404).send({
                status: 404,
                success: false,
                message: 'User not found or not verified.',
            });
        }

        const { user_firstname, user_lastname, password: hash, role, user_id } = rows[0];

        const isPasswordValid = await bcrypt.compare(password, hash);
        if (!isPasswordValid) {
            return res.status(401).send({
                status: 401,
                success: false,
                message: 'Invalid credentials.',
            });
        }

        const token = jwt.sign(
            { user_firstname, user_lastname, email, user_id, role },
            process.env.JWT_SECRET as string,
            { expiresIn: process.env.EXPIRESIN }
        );

        res.status(200).send({
            status: 200,
            success: true,
            message: 'Login successful.',
            results: { token, role, user_id },
        });

    } catch (err) {
        console.error(err);
        res.status(500).send({
            status: 500,
            success: false,
            message: 'Internal Server Error.',
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
}));

router.use(authMiddleware)

router.get("/logout", controllersWrapper((req: Request, res: Response) => {
    res.status(200).send({
        status: 200,
        success: true,
        message: 'Logged out successfully!',
    });
}))

export default router;