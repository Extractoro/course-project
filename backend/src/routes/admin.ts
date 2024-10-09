import dotenv from "dotenv";
import {Request, Response, Router} from "express";
import authMiddleware from "../middlewares/authMiddleware";
import adminMiddleware from "../middlewares/adminMiddleware";
import controllersWrapper from "../helpers/controllersWrapper";
import database from "../utils/database";

dotenv.config();
const router = Router();

router.use(authMiddleware)
router.use(adminMiddleware)

router.post("/create_event", controllersWrapper(async (req: Request, res: Response) => {
   const { venue_name, address, city, capacity, event_name, event_date, category, description = null, ticket_price, available_tickets } = req.body;

   const categoryLower = category.trim().toLowerCase();

   const checkCategoryQuery = `SELECT * FROM categories WHERE LOWER(category_name) = ?`;

   database.getConnection(function (err, connection) {
      if (err) {
         return res.status(500).send({
            status: 500,
            success: false,
            message: err.message,
         });
      }

      connection.query(checkCategoryQuery, [categoryLower], function (err, rows) {
         if (err) {
            connection.release();
            return res.status(500).send({
               status: 500,
               success: false,
               message: err.message,
            });
         }

         if (rows.length === 0) {
            connection.release();
            return res.status(400).send({
               status: 400,
               success: false,
               message: 'Invalid category',
            });
         }

         const checkEventQuery = `
                SELECT * FROM events 
                JOIN venues ON events.venue_id = venues.venue_id
                WHERE event_name = ? 
                AND event_date = ? 
                AND venue_name = ? 
                AND address = ? 
                AND city = ?
            `;

         connection.query(checkEventQuery, [event_name, event_date, venue_name, address, city], function (err, rows) {
            if (err) {
               connection.release();
               return res.status(500).send({
                  status: 500,
                  success: false,
                  message: err.message,
               });
            }

            if (rows.length > 0) {
               connection.release();
               return res.status(409).send({
                  status: 409,
                  success: false,
                  message: 'Event with the same name, date, and venue already exists',
               });
            }

            const addVenueQuery = `INSERT INTO venues (venue_name, address, city, capacity)
                                       VALUES (?, ?, ?, ?)`;

            connection.beginTransaction(err => {
               if (err) return res.status(500).send(err.message);

               connection.query(addVenueQuery, [venue_name, address, city, capacity], function (err, result) {
                  if (err) {
                     return connection.rollback(() => {
                        res.status(500).send({ status: 500, success: false, message: err.message });
                     });
                  }

                  const venue_id = result.insertId;

                  const addEventQuery = `INSERT INTO events (event_name, event_date, category, description, venue_id,
                                                                    ticket_price, available_tickets)
                                               VALUES (?, ?, ?, ?, ?, ?, ?)`;

                  connection.query(addEventQuery, [event_name, event_date, categoryLower, description, venue_id, ticket_price, available_tickets], function (err, result) {
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
                           success: true,
                           message: 'Event and Venue added successfully!',
                           eventId: result.insertId,
                           venueId: venue_id
                        });
                     });
                  });
               });
            });
         });
      });
   });
}));

router.put("/update_event/:id", controllersWrapper(async (req: Request, res: Response) => {
   const event_id: number = Number(req.params.id);

   if (isNaN(event_id)) {
      return res.status(400).send({ status: 400, success: false, message: 'Invalid event ID' });
   }

   const { venue_name, address, city, capacity, event_name, event_date, category, description = null, ticket_price, available_tickets } = req.body;

   const categoryLower = category.trim().toLowerCase();

   const checkCategoryQuery = `SELECT * FROM categories WHERE LOWER(category_name) = ?`;

   database.getConnection(function (err, connection) {
      if (err) {
         return res.status(500).send({
            status: 500,
            success: false,
            message: err.message,
         });
      }

      connection.query(checkCategoryQuery, [categoryLower], function (err, rows) {
         if (err) {
            connection.release();
            return res.status(500).send({
               status: 500,
               success: false,
               message: err.message,
            });
         }

         if (rows.length === 0) {
            connection.release();
            return res.status(400).send({
               status: 400,
               success: false,
               message: 'Invalid category',
            });
         }

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

         connection.query(checkEventQuery, [event_id, event_name, event_date, venue_name, address, city], function (err, rows) {
            if (err) {
               connection.release();
               return res.status(500).send({
                  status: 500,
                  success: false,
                  message: err.message,
               });
            }

            if (rows.length > 0) {
               connection.release();
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
                    SET event_name = ?, event_date = ?, category = ?, description = ?, ticket_price = ?, available_tickets = ?
                    WHERE event_id = ?
                `;

            connection.beginTransaction(err => {
               if (err) return res.status(500).send(err.message);

               connection.query(updateVenueQuery, [venue_name, address, city, capacity, event_id], function (err, result) {
                  if (err) {
                     return connection.rollback(() => {
                        res.status(500).send({ status: 500, success: false, message: err.message });
                     });
                  }

                  connection.query(updateEventQuery, [event_name, event_date, categoryLower, description, ticket_price, available_tickets, event_id], function (err, result) {
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
                           success: true,
                           message: 'Event and Venue updated successfully!',
                        });
                     });
                  });
               });
            });
         });
      });
   });
}));

router.delete("/delete_event/:id", controllersWrapper(async (req: Request, res: Response) => {
   const event_id: number = Number(req.params.id);

   if (isNaN(event_id)) {
      return res.status(400).send({ status: 400, success: false, message: 'Invalid event ID' });
   }

   database.getConnection(function (err, connection) {
      if (err) {
         return res.status(500).send({
            status: 500,
            success: false,
            message: err.message,
         });
      }

      connection.beginTransaction(err => {
         if (err) return res.status(500).send(err.message);

         const getVenueIdQuery = `SELECT venue_id FROM events WHERE event_id = ?`;

         connection.query(getVenueIdQuery, [event_id], function (err, result) {
            if (err) {
               return connection.rollback(() => {
                  res.status(500).send({ status: 500, success: false, message: err.message });
               });
            }

            if (result.length === 0) {
               return connection.rollback(() => {
                  res.status(404).send({ status: 404, success: false, message: 'Event not found' });
               });
            }

            const venue_id = result[0].venue_id;

            const deleteEventQuery = `DELETE FROM events WHERE event_id = ?`;
            connection.query(deleteEventQuery, [event_id], function (err, result) {
               if (err) {
                  return connection.rollback(() => {
                     res.status(500).send({ status: 500, success: false, message: err.message });
                  });
               }

               const checkVenueUsageQuery = `SELECT COUNT(*) AS count FROM events WHERE venue_id = ?`;
               connection.query(checkVenueUsageQuery, [venue_id], function (err, result) {
                  if (err) {
                     return connection.rollback(() => {
                        res.status(500).send({ status: 500, success: false, message: err.message });
                     });
                  }

                  if (result[0].count === 0) {
                     const deleteVenueQuery = `DELETE FROM venues WHERE venue_id = ?`;
                     connection.query(deleteVenueQuery, [venue_id], function (err, result) {
                        if (err) {
                           return connection.rollback(() => {
                              res.status(500).send({ status: 500, success: false, message: err.message });
                           });
                        }
                     });
                  }

                  connection.commit((err) => {
                     if (err) {
                        return connection.rollback(() => {
                           res.status(500).send({ status: 500, success: false, message: err.message });
                        });
                     }

                     res.status(200).send({
                        success: true,
                        message: 'Event deleted successfully!',
                     });
                  });
               });
            });
         });
      });
   });
}));

export default router;