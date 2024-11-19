import dotenv from "dotenv";
import {Request, Response, Router} from "express";
import authMiddleware from "../middlewares/authMiddleware";
import adminMiddleware from "../middlewares/adminMiddleware";
import controllersWrapper from "../helpers/controllersWrapper";
import {getConnection} from "../utils/database";

dotenv.config();
const router = Router();

// router.use(authMiddleware)
// router.use(adminMiddleware)

router.post(
    "/create_event",
    controllersWrapper(async (req: Request, res: Response) => {
       const {
          venue_name,
          address,
          city,
          capacity,
          event_name,
          event_date,
          category,
          description = "",
          ticket_price,
          isAvailable,
          available_tickets,
          isRecurring = false,
          start_date = null,
          end_date = null,
          frequency = null,
          repeat_interval = 1,
       } = req.body;

       if (
           !venue_name ||
           !address ||
           !city ||
           !capacity ||
           !event_name ||
           !event_date ||
           !category || !available_tickets ||
           !ticket_price
       ) {
          return res.status(400).send({
             success: false,
             message: "All required fields must be filled: venue_name, address, city, capacity, event_name, event_date, category, ticket_price, available_tickets, and capacity_event.",
          });
       }

       if (isRecurring && (!start_date || !end_date || !frequency)) {
          return res.status(400).send({
             success: false,
             message:
                 "Missing required fields for recurring event: start_date, end_date, and frequency are required.",
          });
       }

       if (Number(available_tickets) > Number(capacity)) {
          return res.status(400).send({
             success: false,
             message: "Available tickets cannot exceed venue capacity.",
          });
       }

       const connection = await getConnection();

       try {
          await connection.beginTransaction();

          const [categoryRows] = await connection.query<any[]>(
              `SELECT category_id FROM categories WHERE LOWER(category_name) = ?`,
              [category.trim().toLowerCase()]
          );

          if (categoryRows && categoryRows.length === 0) {
             return res.status(400).send({
                success: false,
                message: "Invalid category.",
             });
          }

          const categoryId = categoryRows[0].category_id;

          const [eventRows] = await connection.query<any[]>(
              `
                SELECT * FROM events 
                JOIN venues ON events.venue_id = venues.venue_id
                WHERE event_name = ? AND event_date = ? AND venue_name = ? AND address = ? AND city = ?
            `,
              [event_name, event_date, venue_name, address, city]
          );

          if (eventRows.length > 0) {
             return res.status(409).send({
                success: false,
                message: "Event with the same name, date, and venue already exists.",
             });
          }

          const [venueResult] = await connection.query<any>(
              `INSERT INTO venues (venue_name, address, city, capacity) VALUES (?, ?, ?, ?)`,
              [venue_name, address, city, capacity]
          );

          const venue_id = venueResult.insertId;

          const [eventResult] = await connection.query<any>(
              `INSERT INTO events (event_name, event_date, category_id, description, venue_id, ticket_price, available_tickets, isAvailable, is_recurring, capacity_event) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                 event_name,
                 event_date,
                 categoryId,
                 description,
                 venue_id,
                 ticket_price,
                 available_tickets,
                 isAvailable,
                 isRecurring,
                 available_tickets,
              ]
          );

          const event_id = eventResult.insertId;

          if (isRecurring && start_date && end_date && frequency) {
             await connection.query(
                 `INSERT INTO recurring_events (event_id, frequency, repeat_interval, start_date, end_date) VALUES (?, ?, ?, ?, ?)`,
                 [event_id, frequency, repeat_interval, start_date, end_date]
             );
          }

          await connection.commit();

          res.status(200).send({
             success: true,
             message: "Event and venue added successfully!",
             eventId: event_id,
             venueId: venue_id,
          });
       }  catch (err: any) {
          await connection.rollback();
          res.status(500).send({
             success: false,
             message: err.message || "An error occurred while creating the event.",
          });
       } finally {
          connection.release();
       }
    })
);

router.put(
    "/update_event/:id",
    controllersWrapper(async (req: Request, res: Response) => {
       const event_id: number = Number(req.params.id);

       if (isNaN(event_id)) {
          return res
              .status(400)
              .send({ status: 400, success: false, message: "Invalid event ID" });
       }

       const {
          venue_name,
          address,
          city,
          capacity,
          event_name,
          event_date,
          category,
          description = "",
          ticket_price,
          available_tickets,
          isAvailable,
          capacity_event,
       } = req.body;

       if (
           !venue_name ||
           !address ||
           !city ||
           !capacity ||
           !event_name ||
           !event_date ||
           !category ||
           !ticket_price ||
           !available_tickets ||
           !capacity_event
       ) {
          return res.status(400).send({
             success: false,
             message: "All required fields must be filled: venue_name, address, city, capacity, event_name, event_date, category, ticket_price, available_tickets, and capacity_event.",
          });
       }

       if (Number(capacity_event) > Number(capacity)) {
          return res.status(400).send({
             success: false,
             message: "Event capacity cannot exceed venue capacity.",
          });
       }

       if (Number(available_tickets) > Number(capacity_event)) {
          return res.status(400).send({
             success: false,
             message: "Available tickets cannot exceed event capacity.",
          });
       }

       const categoryLower = category.trim().toLowerCase();
       const checkCategoryQuery = `SELECT category_id FROM categories WHERE LOWER(category_name) = ?`;

       let connection = null;

       try {
          connection = await getConnection();

          const [categoryRows] = await connection.query<any>(checkCategoryQuery, [
             categoryLower,
          ]);

          if ( categoryRows && categoryRows.length === 0) {
             return res.status(400).send({
                status: 400,
                success: false,
                message: "Invalid category",
             });
          }

          const categoryId = categoryRows[0].category_id;

          const checkEventQuery = `
                SELECT * FROM events 
                JOIN venues ON events.venue_id = venues.venue_id
                WHERE event_id != ? 
                  AND event_name = ? 
                  AND event_date = ? 
                  AND venue_name = ? 
                  AND address = ? 
                  AND city = ?
            `;

          const [eventRows] = await connection.query<any>(checkEventQuery, [
             event_id,
             event_name,
             event_date,
             venue_name,
             address,
             city,
          ]);

          if (eventRows.length > 0) {
             return res.status(409).send({
                status: 409,
                success: false,
                message:
                    "Event with the same name, date, and venue already exists",
             });
          }

          const checkVenueCapacityQuery = `
                SELECT capacity FROM venues
                JOIN events ON events.venue_id = venues.venue_id
                WHERE event_id = ?
            `;

          const [venueRows] = await connection.query<any>(checkVenueCapacityQuery, [
             event_id,
          ]);

          if (venueRows && venueRows.length === 0) {
             return res.status(400).send({
                status: 400,
                success: false,
                message: "Venue not found",
             });
          }

          const venueCapacity = venueRows[0].capacity;

          if (capacity_event > venueCapacity) {
             return res.status(400).send({
                status: 400,
                success: false,
                message: "Event capacity cannot exceed venue capacity",
             });
          }

          const updateVenueQuery = `
                UPDATE venues 
                SET venue_name = ?, address = ?, city = ?, capacity = ? 
                WHERE venue_id = (SELECT venue_id FROM events WHERE event_id = ?)
            `;

          const updateEventQuery = `
                UPDATE events 
                SET event_name = ?, event_date = ?, category_id = ?, description = ?, ticket_price = ?, available_tickets = ?, isAvailable = ?, capacity_event = ?
                WHERE event_id = ?
            `;

          await connection.beginTransaction();

          await connection.query(updateVenueQuery, [
             venue_name,
             address,
             city,
             capacity,
             event_id,
          ]);

          await connection.query(updateEventQuery, [
             event_name,
             event_date,
             categoryId,
             description,
             ticket_price,
             available_tickets,
             isAvailable,
             capacity_event,
             event_id,
          ]);

          await connection.commit();

          res.status(200).send({
             success: true,
             message: "Event and Venue updated successfully!",
             status: 200,
          });
       } catch (err) {
          if (connection) {
             await connection.rollback();
          }

          res.status(500).send({
             status: 500,
             success: false,
             message: "Internal Server Error",
          });
       } finally {
          if (connection) {
             await connection.release();
          }
       }
    })
);

router.delete(
    "/delete_event/:id",
    controllersWrapper(async (req: Request, res: Response) => {
       const event_id: number = Number(req.params.id);

       if (isNaN(event_id)) {
          return res
              .status(400)
              .send({ status: 400, success: false, message: "Invalid event ID" });
       }

       const connection = await getConnection();

       try {
          await connection.beginTransaction();

          const [venueResult] = await connection.query<any[]>(
              `SELECT venue_id FROM events WHERE event_id = ?`,
              [event_id]
          );

          if (venueResult && venueResult.length === 0) {
             await connection.rollback();
             return res.status(404).send({
                status: 404,
                success: false,
                message: "Event not found",
             });
          }

          const venue_id = venueResult[0].venue_id;

          await connection.query(`DELETE FROM events WHERE event_id = ?`, [
             event_id,
          ]);

          const [usageResult] = await connection.query<any[]>(
              `SELECT COUNT(*) AS count FROM events WHERE venue_id = ?`,
              [venue_id]
          );

          if (usageResult[0].count === 0) {
             await connection.query(`DELETE FROM venues WHERE venue_id = ?`, [
                venue_id,
             ]);
          }

          await connection.commit();

          res.status(200).send({
             success: true,
             message: "Event deleted successfully!",
             status: 200,
          });
       } catch (err: any) {
          await connection.rollback();
          if (err.message === "Event not found") {
             return res.status(404).send({
                status: 404,
                success: false,
                message: err.message,
             });
          }
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

router.get(
    "/all_tickets",
    controllersWrapper(async (req: Request, res: Response) => {
       const getAllTicketsQuery = `
        SELECT
            t.ticket_id,
            t.event_id,
            t.user_id,
            t.purchase_date,
            t.ticket_status,
            e.event_name,
            e.category_id,
            e.event_date,
            e.capacity_event,
            e.ticket_price,
            e.isAvailable,
            c.category_name,
            u.user_firstname,
            u.user_lastname,
            u.email
        FROM tickets t
        JOIN events e ON t.event_id = e.event_id
        JOIN users u ON t.user_id = u.user_id
        JOIN categories c ON c.category_id = e.category_id
    `;

       const connection = await getConnection();

       try {
          const [tickets] = await connection.query<any[]>(getAllTicketsQuery);

          if (!tickets.length) {
             return res.status(404).send({
                status: 404,
                success: false,
                message: "No tickets found.",
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
             message: "Internal Server Error",
          });
       } finally {
          connection.release();
       }
    })
);


router.get(
    "/all_users",
    controllersWrapper(async (req: Request, res: Response) => {
       const getAllUsersQuery = `
        SELECT
            u.user_firstname,
            u.user_lastname,
            u.email,
            u.verify
        FROM users u
    `;

       const connection = await getConnection();

       try {
          const [users] = await connection.query<any[]>(getAllUsersQuery);

          if (!users.length) {
             return res.status(404).send({
                status: 404,
                success: false,
                message: "No users found.",
             });
          }

          res.status(200).send({
             status: 200,
             success: true,
             data: users,
          });
       } catch (err) {
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

export default router;