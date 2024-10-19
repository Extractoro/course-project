import dotenv from "dotenv";
import {Request, Response, Router} from "express";
import authMiddleware from "../middlewares/authMiddleware";
import controllersWrapper from "../helpers/controllersWrapper";
import {getConnection} from "../utils/database";
import {PoolConnection} from "mysql";

dotenv.config();
const router = Router();

router.use(authMiddleware)

router.post("/book_tickets", controllersWrapper(async (req: Request, res: Response) => {
    const { event_id, user_id, quantity } = req.body;

    if (!event_id || !user_id || !quantity) {
        return res.status(401).send({
            status: 401,
            success: false,
            message: "Missing required fields!",
        });
    }

    if (quantity <= 0) {
        return res.status(400).send({ status: 400, success: false, message: 'Invalid quantity' });
    }

    const getEventQuery = `SELECT available_tickets FROM events WHERE event_id = ?`;

    let connection: PoolConnection | null = null;

    try {
        connection = await getConnection();

        const availableTickets = await new Promise<number>((resolve, reject) => {
            connection!.query(getEventQuery, [event_id], (err, result) => {
                if (err) return reject(err);
                if (result.length === 0) return reject(new Error('Event not found'));
                resolve(result[0].available_tickets);
            });
        });

        if (availableTickets < quantity) {
            return res.status(400).send({ status: 400, success: false, message: 'Not enough available tickets' });
        }

        const userTicketsQuery = `SELECT COUNT(*) AS ticket_count FROM tickets WHERE user_id = ? AND event_id = ?`;
        const [userResult] = await new Promise<any[]>((resolve, reject) => {
            connection!.query(userTicketsQuery, [user_id, event_id], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });

        const userTicketCount = userResult[0]?.ticket_count || 0;
        const totalTicketsAllowed = Math.max(Math.floor((availableTickets + userTicketCount) * 0.05), 1);
        const remainingTicketsAllowed = totalTicketsAllowed - userTicketCount;

        if (quantity > remainingTicketsAllowed) {
            return res.status(400).send({
                status: 400,
                success: false,
                message: `You can only book up to ${remainingTicketsAllowed} more tickets for this event.`,
            });
        }

        await new Promise<void>((resolve, reject) => {
            const insertTicketQuery = `INSERT INTO tickets (event_id, user_id, ticket_status) VALUES (?, ?, 'booked')`;
            const ticketPromises = Array.from({ length: quantity }, (_, i) => {
                return new Promise<void>((res, rej) => {
                    connection!.query(insertTicketQuery, [event_id, user_id], (err) => {
                        if (err) return rej(err);
                        res();
                    });
                });
            });
            Promise.all(ticketPromises).then(() => resolve()).catch(reject);
        });

        const updateTicketsQuery = `UPDATE events SET available_tickets = available_tickets - ? WHERE event_id = ?`;
        await new Promise<void>((resolve, reject) => {
            connection!.query(updateTicketsQuery, [quantity, event_id], (err) => {
                if (err) return reject(err);
                resolve();
            });
        });

        res.status(200).send({
            status: 200,
            success: true,
            message: 'Tickets booked successfully!',
        });

    } catch (err: any) {
        res.status(err.message === 'Event not found' ? 404 : 500).send({
            status: err.message === 'Event not found' ? 404 : 500,
            success: false,
            message: err.message,
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
}));

router.post("/return_tickets", controllersWrapper(async (req: Request, res: Response) => {
    const { event_id, user_id, quantity } = req.body;

    if (!quantity || quantity <= 0) {
        return res.status(400).send({ status: 400, success: false, message: 'Invalid quantity' });
    }

    const getUserTicketsQuery = `
        SELECT COUNT(*) AS booked_tickets 
        FROM tickets 
        WHERE user_id = ? AND event_id = ? AND ticket_status = 'booked'
    `;

    const deleteTicketQuery = `
        DELETE FROM tickets 
        WHERE user_id = ? AND event_id = ? AND ticket_status = 'booked' 
        LIMIT ?
    `;

    const updateTicketsQuery = `
        UPDATE events 
        SET available_tickets = available_tickets + ? 
        WHERE event_id = ?
    `;

    let connection: PoolConnection | null = null;

    try {
        connection = await getConnection();
        await connection.beginTransaction();

        const [result] = await new Promise<any[]>((resolve, reject) => {
            connection!.query(getUserTicketsQuery, [user_id, event_id], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });

        const bookedTickets = result?.booked_tickets || 0;

        if (quantity > bookedTickets) {
            throw new Error(`You cannot return more tickets than you have booked. You have only ${bookedTickets} tickets booked.`);
        }

        await new Promise<void>((resolve, reject) => {
            connection!.query(deleteTicketQuery, [user_id, event_id, quantity], (err) => {
                if (err) return reject(err);
                resolve();
            });
        });

        await new Promise<void>((resolve, reject) => {
            connection!.query(updateTicketsQuery, [quantity, event_id], (err) => {
                if (err) return reject(err);
                resolve();
            });
        });

        await connection.commit();
        res.status(200).send({
            status: 200,
            success: true,
            message: 'Tickets returned successfully!',
        });
    } catch (error: any) {
        if (connection) await connection.rollback();
        res.status(500).send({
            status: 500,
            success: false,
            message: error.message,
        });
    } finally {
        if (connection) connection.release();
    }
}));

export default router;