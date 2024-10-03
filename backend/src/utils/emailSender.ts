import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.GOOGLE_EMAIL as string,
        pass: process.env.GOOGLE_PASSWORD as string,
    },
});

export default transporter