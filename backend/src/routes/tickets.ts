import dotenv from "dotenv";
import {Request, Response, Router} from "express";
import authMiddleware from "../middlewares/authMiddleware";
import controllersWrapper from "../helpers/controllersWrapper";
import {getConnection} from "../utils/database";

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

    const connection = await getConnection();

    try {
        const [eventResult] = await connection.query<any[]>(getEventQuery, [event_id]);
        if (!eventResult || eventResult.length === 0) {
            return res.status(404).send({
                status: 404,
                success: false,
                message: 'Event not found',
            });
        }

        const availableTickets = eventResult[0].available_tickets;

        if (availableTickets < quantity) {
            return res.status(400).send({ status: 400, success: false, message: 'Not enough available tickets' });
        }

        const userTicketsQuery = `SELECT COUNT(*) AS ticket_count FROM tickets WHERE user_id = ? AND event_id = ?`;
        const [userResult] = await connection.query<any[]>(userTicketsQuery, [user_id, event_id]);

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

        const insertTicketQuery = `INSERT INTO tickets (event_id, user_id, ticket_status) VALUES (?, ?, 'booked')`;

        const ticketPromises = Array.from({ length: quantity }, () => {
            return connection.query(insertTicketQuery, [event_id, user_id]);
        });

        await Promise.all(ticketPromises);


        const updateTicketsQuery = `UPDATE events SET available_tickets = available_tickets - ? WHERE event_id = ?`;
        await connection.query(updateTicketsQuery, [quantity, event_id]);

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
    }
}));

router.post("/pay_tickets", controllersWrapper(async (req: Request, res: Response) => {
    const { user_id, quantity, event_id } = req.body;

    if (!user_id || !quantity || !event_id) {
        return res.status(401).send({
            status: 401,
            success: false,
            message: "Missing required fields!",
        });
    }

    if (quantity <= 0) {
        return res.status(400).send({
            status: 400,
            success: false,
            message: 'Invalid quantity',
        });
    }

    const connection = await getConnection();

    try {
        const getBookedTicketsQuery = `
            SELECT ticket_id FROM tickets 
            WHERE user_id = ? AND event_id = ? AND ticket_status = 'booked' 
            LIMIT ?`;

        const [bookedTickets] = await connection.query<any[]>(getBookedTicketsQuery, [user_id, event_id, quantity]);

        if (bookedTickets.length < quantity) {
            return res.status(400).send({
                status: 400,
                success: false,
                message: 'Not enough booked tickets available for this user and event',
            });
        }

        const updateTicketStatusQuery = `
            UPDATE tickets 
            SET ticket_status = 'paid' 
            WHERE ticket_id IN (?)`;

        const ticketIds = bookedTickets.map(ticket => ticket.ticket_id);

        await connection.query(updateTicketStatusQuery, [ticketIds]);

        res.status(200).send({
            status: 200,
            success: true,
            message: `${quantity} ticket(s) successfully updated to paid!`,
        });

    } catch (err: any) {
        res.status(500).send({
            status: 500,
            success: false,
            message: err.message,
        });
    } finally {
        connection.release();
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

    const connection = await getConnection();

    try {
        await connection.beginTransaction();

        const [result] = await connection.execute<any[]>(getUserTicketsQuery, [user_id, event_id]);

        const bookedTickets = result[0]?.booked_tickets || 0;

        if (quantity > bookedTickets) {
            throw new Error(`You cannot return more tickets than you have booked. You have only ${bookedTickets} tickets booked.`);
        }

        await connection.query(deleteTicketQuery, [user_id, event_id, quantity]);

        await connection.query(updateTicketsQuery, [quantity, event_id]);

        await connection.commit();

        res.status(200).send({
            status: 200,
            success: true,
            message: 'Tickets returned successfully!',
        });

    } catch (error: any) {
        await connection.rollback();
        res.status(500).send({
            status: 500,
            success: false,
            message: error.message,
        });
    } finally {
        connection.release();
    }
}));

export default router;