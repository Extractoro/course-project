import dotenv from "dotenv";
import {Request, Response, Router} from "express";
import authMiddleware from "../middlewares/authMiddleware";
import adminMiddleware from "../middlewares/adminMiddleware";
import controllersWrapper from "../helpers/controllersWrapper";
import {getConnection} from "../utils/database";
import {PoolConnection} from "mysql";

dotenv.config();
const router = Router();

// router.use(authMiddleware)
// router.use(adminMiddleware)

router.post("/create_event", controllersWrapper(async (req: Request, res: Response) => {
   const {
      venue_name,
      address,
      city,
      capacity,
      event_name,
      event_date,
      category,
      description = '',
      ticket_price,
      available_tickets,
      isAvailable,
      isRecurring = false,
      start_date = null,
      end_date = null,
      frequency = null,
      repeat_interval = 1
   } = req.body;

   console.log(isRecurring)
   console.log(start_date)
   console.log(end_date)
   console.log(frequency)
   console.log(isAvailable)


   if (isRecurring && (!start_date || !end_date || !frequency)) {
      return res.status(400).send({
         success: false,
         message: 'Missing required fields for recurring event: start_date, end_date, and frequency are required.',
      });
   }

   const categoryLower = category.trim().toLowerCase();
   const checkCategoryQuery = `SELECT category_id FROM categories WHERE LOWER(category_name) = ?`;

   let connection: PoolConnection | null = null;

   try {
      connection = await getConnection();

      const [categoryRows] = await new Promise<any[]>((resolve, reject) => {
         connection!.query(checkCategoryQuery, [categoryLower], (err, results) => {
            if (err) return reject(err);
            resolve(results);
         });
      });

      if (categoryRows.length === 0) {
         return res.status(400).send({
            status: 400,
            success: false,
            message: 'Invalid category',
         });
      }

      const categoryId = categoryRows.category_id;

      const checkEventQuery = `
            SELECT * FROM events 
            JOIN venues ON events.venue_id = venues.venue_id
            WHERE event_name = ? 
            AND event_date = ? 
            AND venue_name = ? 
            AND address = ? 
            AND city = ?
        `;

      const [eventRows] = await new Promise<any[]>((resolve, reject) => {
         connection!.query(checkEventQuery, [event_name, event_date, venue_name, address, city], (err, results) => {
            if (err) return reject(err);
            resolve(results);
         });
      });

      if (eventRows) {
         return res.status(409).send({
            status: 409,
            success: false,
            message: 'Event with the same name, date, and venue already exists',
         });
      }

      const addVenueQuery = `INSERT INTO venues (venue_name, address, city, capacity) VALUES (?, ?, ?, ?)`;
      const addEventQuery = `INSERT INTO events (event_name, event_date, category_id, description, venue_id, ticket_price, available_tickets, isAvailable, is_recurring) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      await new Promise<void>((resolve, reject) => {
         connection!.beginTransaction(async (err) => {
            if (err) return reject(err);

            try {
               const venueResult = await new Promise<any>((resolve, reject) => {
                  connection!.query(addVenueQuery, [venue_name, address, city, capacity], (err, result) => {
                     if (err) return reject(err);
                     resolve(result);
                  });
               });

               const venue_id = venueResult.insertId;

               const eventResult = await new Promise<any>((resolve, reject) => {
                  connection!.query(addEventQuery, [event_name, event_date, categoryId, description, venue_id, ticket_price, available_tickets, isAvailable, isRecurring], (err, result) => {
                     if (err) return reject(err);
                     resolve(result);
                  });
               });

               const event_id = eventResult.insertId;

               if (isRecurring && start_date && end_date && frequency) {
                  const addRecurringEventQuery = `
                     INSERT INTO recurring_events (event_id, frequency, repeat_interval, start_date, end_date)
                     VALUES (?, ?, ?, ?, ?)
                  `;
                  await new Promise<void>((resolve, reject) => {
                     connection!.query(addRecurringEventQuery, [event_id, frequency, repeat_interval, start_date, end_date], (err) => {
                        if (err) return reject(err);
                        resolve();
                     });
                  });
               }

               connection!.commit((err) => {
                  if (err) {
                     return connection!.rollback(() => {
                        reject(new Error(err.message));
                     });
                  }
                  res.status(200).send({
                     success: true,
                     message: 'Event and Venue added successfully!',
                     eventId: venueResult.insertId,
                     venueId: venue_id
                  });
                  resolve();
               });
            } catch (err: any) {
               return connection!.rollback(() => {
                  reject(new Error(err.message));
               });
            }
         });
      });

   } catch (err: any) {
      res.status(500).send({
         status: 500,
         success: false,
         message: err?.message,
      });
   } finally {
      if (connection) {
         connection.release();
      }
   }
}));

router.put("/update_event/:id", controllersWrapper(async (req: Request, res: Response) => {
   const event_id: number = Number(req.params.id);

   if (isNaN(event_id)) {
      return res.status(400).send({ status: 400, success: false, message: 'Invalid event ID' });
   }

   const {
      venue_name,
      address,
      city,
      capacity,
      event_name,
      event_date,
      category,
      description = '',
      ticket_price,
      available_tickets,
      isAvailable, // Добавлено новое поле
   } = req.body;

   const categoryLower = category.trim().toLowerCase();
   const checkCategoryQuery = `SELECT category_id FROM categories WHERE LOWER(category_name) = ?`;

   let connection: PoolConnection | null = null;

   try {
      connection = await getConnection();

      const [categoryRows] = await new Promise<any[]>((resolve, reject) => {
         connection!.query(checkCategoryQuery, [categoryLower], (err, results) => {
            if (err) return reject(err);
            resolve(results);
         });
      });

      if (categoryRows.length === 0) {
         return res.status(400).send({
            status: 400,
            success: false,
            message: 'Invalid category',
         });
      }

      const categoryId = categoryRows.category_id;

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

      const [eventRows] = await new Promise<any[]>((resolve, reject) => {
         connection!.query(checkEventQuery, [event_id, event_name, event_date, venue_name, address, city], (err, results) => {
            if (err) return reject(err);
            resolve(results);
         });
      });

      if (eventRows && eventRows.length > 0) {
         return res.status(409).send({
            status: 409,
            success: false,
            message: 'Event with the same name, date, and venue already exists',
         });
      }

      const updateVenueQuery = `
            UPDATE venues 
            SET venue_name = ?, address = ?, city = ?, capacity = ? 
            WHERE venue_id = (SELECT venue_id FROM events WHERE event_id = ?)
        `;

      const updateEventQuery = `
            UPDATE events 
            SET event_name = ?, event_date = ?, category_id = ?, description = ?, ticket_price = ?, available_tickets = ?, isAvailable = ?
            WHERE event_id = ?
        `;

      await new Promise<void>((resolve, reject) => {
         connection!.beginTransaction(async (err) => {
            if (err) return reject(err);

            try {
               await new Promise<void>((resolve, reject) => {
                  connection!.query(updateVenueQuery, [venue_name, address, city, capacity, event_id], (err, result) => {
                     if (err) return reject(err);
                     resolve();
                  });
               });

               await new Promise<void>((resolve, reject) => {
                  // Вставка isAvailable в запрос обновления события
                  connection!.query(updateEventQuery, [event_name, event_date, categoryId, description, ticket_price, available_tickets, isAvailable, event_id], (err, result) => {
                     if (err) return reject(err);
                     resolve();
                  });
               });

               connection!.commit((err) => {
                  if (err) {
                     return connection!.rollback(() => {
                        reject(new Error(err.message));
                     });
                  }

                  res.status(200).send({
                     success: true,
                     message: 'Event and Venue updated successfully!',
                     status: 200,
                  });
                  resolve();
               });
            } catch (err: any) {
               return connection!.rollback(() => {
                  reject(new Error(err.message));
               });
            }
         });
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

router.delete("/delete_event/:id", controllersWrapper(async (req: Request, res: Response) => {
   const event_id: number = Number(req.params.id);

   if (isNaN(event_id)) {
      return res.status(400).send({ status: 400, success: false, message: 'Invalid event ID' });
   }

   let connection: PoolConnection | null = null;

   try {
      connection = await getConnection();
      await new Promise<void>((resolve, reject) => {
         connection!.beginTransaction(async (err) => {
            if (err) return reject(new Error(err.message));

            try {
               const getVenueIdQuery = `SELECT venue_id FROM events WHERE event_id = ?`;
               const [result] = await new Promise<any[]>((resolve, reject) => {
                  connection!.query(getVenueIdQuery, [event_id], (err, results) => {
                     if (err) return reject(err);
                     resolve(results);
                  });
               });

               if (result && result.length === 0) {
                  return connection!.rollback(() => {
                     reject(new Error('Event not found'));
                  });
               }

               const venue_id = result.venue_id;
               
               const deleteEventQuery = `DELETE FROM events WHERE event_id = ?`;
               await new Promise<void>((resolve, reject) => {
                  connection!.query(deleteEventQuery, [event_id], (err) => {
                     if (err) return reject(err);
                     resolve();
                  });
               });

               const checkVenueUsageQuery = `SELECT COUNT(*) AS count FROM events WHERE venue_id = ?`;
               const [usageResult] = await new Promise<any[]>((resolve, reject) => {
                  connection!.query(checkVenueUsageQuery, [venue_id], (err, results) => {
                     if (err) return reject(err);
                     resolve(results);
                  });
               });

               if (usageResult.count === 0) {
                  const deleteVenueQuery = `DELETE FROM venues WHERE venue_id = ?`;
                  await new Promise<void>((resolve, reject) => {
                     connection!.query(deleteVenueQuery, [venue_id], (err) => {
                        if (err) return reject(err);
                        resolve();
                     });
                  });
               }

               connection!.commit((err) => {
                  if (err) {
                     return connection!.rollback(() => {
                        reject(new Error(err.message));
                     });
                  }

                  res.status(200).send({
                     success: true,
                     message: 'Event deleted successfully!',
                     status: 200
                  });
                  resolve();
               });
            } catch (err: any) {
               return connection!.rollback(() => {
                  reject(new Error(err.message));
               });
            }
         });
      });

   } catch (err: any) {
      if (err.message === 'Event not found') {
         return res.status(404).send({
            status: 404,
            success: false,
            message: err.message,
         });
      }
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

router.get("/all_tickets", controllersWrapper(async (req: Request, res: Response) => {
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

   let connection: PoolConnection | null = null;

   try {
      connection = await getConnection();

      if (!connection) {
         throw new Error("Failed to establish database connection.");
      }

      const tickets = await new Promise<any[]>((resolve, reject) => {
         connection!.query(getAllTicketsQuery, (err, results) => {
            if (err) return reject(err);
            resolve(results);
         });
      });

      if (tickets && tickets.length === 0) {
         return res.status(404).send({
            status: 404,
            success: false,
            message: 'No tickets found.',
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

router.get("/all_users", controllersWrapper(async (req: Request, res: Response) => {
   const getAllUsersQuery = `
        SELECT
            u.user_firstname,
            u.user_lastname,
            u.email, u.verify
        FROM users u
    `;

   let connection: PoolConnection | null = null;

   try {
      connection = await getConnection();

      if (!connection) {
         throw new Error("Failed to establish database connection.");
      }

      const users = await new Promise<any[]>((resolve, reject) => {
         connection!.query(getAllUsersQuery, (err, results) => {
            if (err) return reject(err);
            resolve(results);
         });
      });

      if (users && users.length === 0) {
         return res.status(404).send({
            status: 404,
            success: false,
            message: 'No users found.',
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
         message: 'Internal Server Error',
      });
   } finally {
      if (connection) {
         connection.release();
      }
   }
}));

export default router;