import dotenv from "dotenv";
import {Request, Response, Router} from "express";
import authMiddleware from "../middlewares/authMiddleware";
import controllersWrapper from "../helpers/controllersWrapper";
import database from "../utils/database";

dotenv.config();
const router = Router();

// router.use(authMiddleware)

router.get("/events", controllersWrapper(async (req: Request, res: Response) => {
    const getAllEventsQuery = `
        SELECT 
            e.event_id, 
            e.event_name, 
            e.event_date, 
            e.category_id, 
            e.description, 
            e.ticket_price, 
            e.available_tickets,
            v.venue_id,
            v.venue_name,
            v.city,
            v.address,
            v.capacity
        FROM events e
        LEFT JOIN venues v ON e.venue_id = v.venue_id
    `;

    database.getConnection(function (err, connection) {
        if (err) {
            return res.status(500).send({
                status: 500,
                success: false,
                message: err.message,
            });
        }

        connection.query(getAllEventsQuery, function (err, results) {
            connection.release();

            if (err) {
                return res.status(500).send({
                    status: 500,
                    success: false,
                    message: err.message,
                });
            }

            res.status(200).send({
                status: 200,
                success: true,
                data: results,
            });
        });
    });
}));

router.get('/categories', controllersWrapper((req: Request, res: Response) => {
    const getAllCategoriesQuery = `SELECT * FROM categories`;

    database.getConnection(function (err, connection) {
        if (err) {
            return res.status(500).send({
                status: 500,
                success: false,
                message: err.message,
            });
        }

        connection.query(getAllCategoriesQuery, function (err, results) {
            connection.release();

            if (err) {
                return res.status(500).send({
                    status: 500,
                    success: false,
                    message: err.message,
                });
            }

            res.status(200).send({
                status: 200,
                success: true,
                data: results,
            });
        });
    });
}))

router.get("/user_tickets/:user_id", controllersWrapper(async (req: Request, res: Response) => {
    const user_id: number = Number(req.params.user_id);

    if (isNaN(user_id)) {
        return res.status(400).send({ status: 400, success: false, message: 'Invalid user ID' });
    }

    const getUserTicketsQuery = `
        SELECT 
            t.ticket_id,
            t.event_id,
            t.purchase_date,
            t.ticket_status,
            e.event_name,
            e.event_date,
            e.ticket_price
        FROM tickets t
        JOIN events e ON t.event_id = e.event_id
        WHERE t.user_id = ?
    `;

    database.getConnection(function (err, connection) {
        if (err) {
            return res.status(500).send({
                status: 500,
                success: false,
                message: err.message,
            });
        }

        connection.query(getUserTicketsQuery, [user_id], function (err, results) {
            connection.release();

            if (err) {
                return res.status(500).send({
                    status: 500,
                    success: false,
                    message: err.message,
                });
            }

            if (results.length === 0) {
                return res.status(404).send({
                    status: 404,
                    success: false,
                    message: 'No tickets found for this user.',
                });
            }

            res.status(200).send({
                status: 200,
                success: true,
                data: results,
            });
        });
    });
}));


export default router;