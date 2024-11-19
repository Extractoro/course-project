// import {NextFunction, Request, Response} from "express";
// import jwt, {JwtPayload} from "jsonwebtoken";
// import database from "../utils/database";
//
// const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
//     database.getConnection( function(err, connection) {
//         if (err) {
//             return res.status(500).send({
//                 status: 500,
//                 success: false,
//                 message: "Database connection failed!",
//             });
//         }
//
//         const token = req.cookies?.token;
//
//         if (!token) {
//             res.status(401).send({
//                 status: 401,
//                 success: false,
//                 message: "No token provided or invalid token!"
//             })
//         }
//
//         const decoded = jwt.decode(token) as JwtPayload;
//
//         if (!decoded || typeof decoded === 'string' || !decoded.email) {
//             return res.status(401).send({
//                 status: 401,
//                 success: false,
//                 message: 'Invalid token!',
//             });
//         }
//
//         const sqlQuery = `SELECT role FROM users WHERE email = ?`;
//
//         connection.query(sqlQuery, [decoded?.email], function (err, rows) {
//             connection.release();
//
//             if (err) {
//                 return res.status(400).send({
//                     status: 400,
//                     success: false,
//                     message: err.message,
//                 });
//             }
//
//             if (rows.length === 0) {
//                 connection.release();
//                 return res.status(404).send({
//                     status: 404,
//                     success: false,
//                     message: 'User not found or not verified.',
//                 });
//             }
//
//             if (rows[0].role !== 'admin') {
//                 return res.status(403).send({
//                     status: 403,
//                     success: false,
//                     message: "Access denied. Admins only!",
//                     results: {email: decoded.email, role: rows[0].role},
//                 });
//             }
//
//             next();
//         })
//
//     })
// }
//
// export default adminMiddleware;


import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { getConnection } from "../utils/database";

const adminMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const connection = await getConnection();

        const token = req.cookies?.token;

        if (!token) {
            return res.status(401).send({
                status: 401,
                success: false,
                message: "No token provided or invalid token!"
            });
        }

        const decoded = jwt.decode(token) as JwtPayload;

        if (!decoded || typeof decoded === 'string' || !decoded.email) {
            return res.status(401).send({
                status: 401,
                success: false,
                message: 'Invalid token!',
            });
        }

        const sqlQuery = `SELECT role FROM users WHERE email = ?`;
        const [rows]: any = await connection.query(sqlQuery, [decoded.email]);

        connection.release();

        if (rows && rows.length === 0) {
            return res.status(404).send({
                status: 404,
                success: false,
                message: 'User not found or not verified.',
            });
        }

        if (rows[0].role !== 'admin') {
            return res.status(403).send({
                status: 403,
                success: false,
                message: "Access denied. Admins only!",
                results: { email: decoded.email, role: rows[0].role },
            });
        }

        next();
    } catch (error: any) {
        return res.status(500).send({
            status: 500,
            success: false,
            message: error.message || "Internal server error",
        });
    }
};

export default adminMiddleware;
