import dotenv from "dotenv";
import {Request, Response, Router} from "express";
import authMiddleware from "../middlewares/authMiddleware";
import controllersWrapper from "../helpers/controllersWrapper";
import {getConnection} from "../utils/database";
import {PoolConnection} from "mysql";

dotenv.config();
const router = Router();

router.use(authMiddleware)

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

    let connection: PoolConnection | null = null;

    try {
        connection = await getConnection();

        if (!connection) {
            throw new Error("Failed to establish database connection.");
        }

        const events = await new Promise<any[]>((resolve, reject) => {
            connection!.query(getAllEventsQuery, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });

        res.status(200).send({
            status: 200,
            success: true,
            data: events,
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

router.get('/categories', controllersWrapper(async (req: Request, res: Response) => {
    const getAllCategoriesQuery = `SELECT * FROM categories`;
    let connection: PoolConnection | null = null;

    try {
        connection = await getConnection();

        if (!connection) {
            throw new Error("Failed to establish database connection.");
        }

        const categories = await new Promise<any[]>((resolve, reject) => {
            connection!.query(getAllCategoriesQuery, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });

        res.status(200).send({
            status: 200,
            success: true,
            data: categories,
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

    let connection: PoolConnection | null = null;

    try {
        connection = await getConnection();

        if (!connection) {
            throw new Error("Failed to establish database connection.");
        }

        const tickets = await new Promise<any[]>((resolve, reject) => {
            connection!.query(getUserTicketsQuery, [user_id], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });

        if (tickets.length === 0) {
            return res.status(404).send({
                status: 404,
                success: false,
                message: 'No tickets found for this user.',
            });
        }

        res.status(200).send({
            status: 200,
            success: true,
            data: tickets,
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

export default router;