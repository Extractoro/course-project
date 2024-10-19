import dotenv from "dotenv";
import {Request, Response, Router} from "express";
import authMiddleware from "../middlewares/authMiddleware";
import adminMiddleware from "../middlewares/adminMiddleware";
import controllersWrapper from "../helpers/controllersWrapper";
import {getConnection} from "../utils/database";
import {PoolConnection} from "mysql";

dotenv.config();
const router = Router();

router.use(authMiddleware)
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
      description = null,
      ticket_price,
      available_tickets,
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

      if (eventRows && eventRows.length > 0) {
         return res.status(409).send({
            status: 409,
            success: false,
            message: 'Event with the same name, date, and venue already exists',
         });
      }

      const addVenueQuery = `INSERT INTO venues (venue_name, address, city, capacity) VALUES (?, ?, ?, ?)`;
      const addEventQuery = `INSERT INTO events (event_name, event_date, category_id, description, venue_id, ticket_price, available_tickets) VALUES (?, ?, ?, ?, ?, ?, ?)`;

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

               await new Promise<void>((resolve, reject) => {
                  connection!.query(addEventQuery, [event_name, event_date, categoryId, description, venue_id, ticket_price, available_tickets], (err, result) => {
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
      description = null,
      ticket_price,
      available_tickets,
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

      const [eventRows] = await new Promise<any[]>((resolve, reject) => {
         connection!.query(checkEventQuery, [event_id, event_name, event_date, venue_name, address, city], (err, results) => {
            if (err) return reject(err);
            resolve(results);
         });
      });

      if (eventRows.length > 0) {
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
            SET event_name = ?, event_date = ?, category_id = ?, description = ?, ticket_price = ?, available_tickets = ?
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
                  connection!.query(updateEventQuery, [event_name, event_date, categoryId, description, ticket_price, available_tickets, event_id], (err, result) => {
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

               if (result.length === 0) {
                  return connection!.rollback(() => {
                     reject(new Error('Event not found'));
                  });
               }

               const venue_id = result[0].venue_id;

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

               if (usageResult[0].count === 0) {
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

export default router;