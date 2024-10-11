import {NextFunction, Request, Response} from "express";

import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization ?? ""
    const [tokenType, token] = authHeader.split(" ");

    if (!token || !tokenType) {
        res.status(401).send({
            status: 401,
            success: false,
            message: "No token provided or invalid token!"
        })
    }

    try {
        jwt.verify(token, process.env.JWT_SECRET as string, (err: any, value: any) => {
            if (err) {
                return res.status(401).send({
                    status: 401,
                    success: false,
                    message: "Invalid token!"
                })
            } else {
                (<any>req).user = value;
                next();
            }
        })
    } catch (err) {
        next(new Error("Invalid token"));
    }
};

export default authMiddleware;