import dotenv from "dotenv";
import {Request, Response, Router} from "express";
import authMiddleware from "../middlewares/authMiddleware";
import controllersWrapper from "../helpers/controllersWrapper";
import database from "../utils/database";

dotenv.config();
const router = Router();

router.use(authMiddleware)

router.post("/book_tickets", controllersWrapper((req: Request, res: Response) => {
    const { event_id, user_id, quantity } = req.body;

    if (!event_id || !user_id || !quantity) {
        return res.status(401).send({
            status: 401,
            success: false,
            message: "Missing required fields!",
        })
    }

    if (!quantity || quantity <= 0) {
        return res.status(400).send({ status: 400, success: false, message: 'Invalid quantity' });
    }

    const getEventQuery = `SELECT available_tickets FROM events WHERE event_id = ?`;

    database.getConnection(async function (err, connection) {
        if (err) {
            return res.status(500).send({ status: 500, success: false, message: err.message });
        }

        connection.beginTransaction(async (err) => {
            if (err) {
                return res.status(500).send({ status: 500, success: false, message: err.message });
            }

            connection.query(getEventQuery, [event_id], async function (err, result) {
                if (err) {
                    return connection.rollback(() => {
                        res.status(500).send({ status: 500, success: false, message: err.message });
                    });
                }

                const availableTickets = result[0]?.available_tickets;

                if (availableTickets < quantity) {
                    return connection.rollback(() => {
                        res.status(400).send({ status: 400, success: false, message: 'Not enough available tickets' });
                    });
                }

                const userTicketsQuery = `SELECT COUNT(*) AS ticket_count FROM tickets WHERE user_id = ? AND event_id = ?`;
                connection.query(userTicketsQuery, [user_id, event_id], async function (err, userResult) {
                    if (err) {
                        return connection.rollback(() => {
                            res.status(500).send({ status: 500, success: false, message: err.message });
                        });
                    }

                    const userTicketCount = userResult[0]?.ticket_count || 0;

                    const totalTicketsAllowed = Math.max(Math.floor((availableTickets + userTicketCount) * 0.05), 1);

                    const remainingTicketsAllowed = totalTicketsAllowed - userTicketCount;

                    if (quantity > remainingTicketsAllowed) {
                        return connection.rollback(() => {
                            res.status(400).send({
                                status: 400,
                                success: false,
                                message: `You can only book up to ${remainingTicketsAllowed} more tickets for this event.`,
                            });
                        });
                    }

                    const insertTicketQuery = `INSERT INTO tickets (event_id, user_id, ticket_status) VALUES (?, ?, 'booked')`;

                    for (let i = 0; i < quantity; i++) {
                        connection.query(insertTicketQuery, [event_id, user_id], function (err) {
                            if (err) {
                                return connection.rollback(() => {
                                    res.status(500).send({ status: 500, success: false, message: err.message });
                                });
                            }
                        });
                    }

                    const updateTicketsQuery = `UPDATE events SET available_tickets = available_tickets - ? WHERE event_id = ?`;

                    connection.query(updateTicketsQuery, [quantity, event_id], async function (err) {
                        if (err) {
                            return connection.rollback(() => {
                                res.status(500).send({ status: 500, success: false, message: err.message });
                            });
                        }

                        connection.commit((err) => {
                            if (err) {
                                return connection.rollback(() => {
                                    res.status(500).send({ status: 500, success: false, message: err.message });
                                });
                            }

                            res.status(200).send({
                                status: 200,
                                success: true,
                                message: 'Tickets booked successfully!',
                            });
                        });
                    });
                });
            });
        });
    });
}))

router.post("/return_tickets", controllersWrapper((req: Request, res: Response) => {
    const { event_id, user_id, quantity } = req.body;

    if (!quantity || quantity <= 0) {
        return res.status(400).send({ status: 400, success: false, message: 'Invalid quantity' });
    }

    const getUserTicketsQuery = `SELECT COUNT(*) AS booked_tickets FROM tickets WHERE user_id = ? AND event_id = ? AND ticket_status = 'booked'`;

    database.getConnection(async function (err, connection) {
        if (err) {
            return res.status(500).send({ status: 500, success: false, message: err.message });
        }

        connection.beginTransaction(async (err) => {
            if (err) {
                return res.status(500).send({ status: 500, success: false, message: err.message });
            }

            connection.query(getUserTicketsQuery, [user_id, event_id], async function (err, result) {
                if (err) {
                    return connection.rollback(() => {
                        res.status(500).send({ status: 500, success: false, message: err.message });
                    });
                }

                const bookedTickets = result[0]?.booked_tickets || 0;

                if (quantity > bookedTickets) {
                    return connection.rollback(() => {
                        res.status(400).send({
                            status: 400,
                            success: false,
                            message: `You cannot return more tickets than you have booked. You have only ${bookedTickets} tickets booked.`,
                        });
                    });
                }

                const deleteTicketQuery = `
                    DELETE FROM tickets
                    WHERE user_id = ? AND event_id = ? AND ticket_status = 'booked' LIMIT ${quantity}`;

                connection.query(deleteTicketQuery, [user_id, event_id, quantity], function (err) {
                    if (err) {
                        return connection.rollback(() => {
                            res.status(500).send({ status: 500, success: false, message: err.message });
                        });
                    }

                    const updateTicketsQuery = `UPDATE events SET available_tickets = available_tickets + ? WHERE event_id = ?`;

                    connection.query(updateTicketsQuery, [quantity, event_id], function (err) {
                        if (err) {
                            return connection.rollback(() => {
                                res.status(500).send({ status: 500, success: false, message: err.message });
                            });
                        }

                        connection.commit((err) => {
                            if (err) {
                                return connection.rollback(() => {
                                    res.status(500).send({ status: 500, success: false, message: err.message });
                                });
                            }

                            res.status(200).send({
                                status: 200,
                                success: true,
                                message: 'Tickets returned successfully!',
                            });
                        });
                    });
                });
            });
        });
    });
}));

export default router;