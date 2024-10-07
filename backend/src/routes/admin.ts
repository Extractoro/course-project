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

   const validCategories = ['concerts', 'theaters_and_performances', 'sports_events', 'cinema', 'festivals', 'exhibitions', 'workshops_and_trainings', 'conferences', 'parties_and_club_events', 'standup_and_comedy_shows', 'charity_events', 'seminars_and_workshops', 'childrens_events', 'ballet_and_opera', 'dance_shows', 'virtual_online_events', 'fairs_and_markets', 'gastronomic_events', 'tours_and_excursions', 'game_events', 'motorsports', 'fashion_shows', 'public_lectures', 'circus_shows', 'folk_and_cultural_festivals', 'other'];

   const categoryLower = category.trim().toLowerCase();

   if (!validCategories.includes(category)) {
      return res.status(400).send({ status: 400, success: false, message: 'Invalid category' });
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

   database.getConnection( function(err, connection) {
      if (err) {
         return res.status(500).send({
            status: 500,
            success: false,
            message: err.message,
         })
      }

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
                     res.status(500).send({status: 500, success: false, message: err.message});
                  });
               }

               const venue_id = result.insertId

               const addEventQuery = `INSERT INTO events (event_name, event_date, category, description, venue_id,
                                                          ticket_price, available_tickets)
                                      VALUES (?, ?, ?, ?, ?, ?, ?)`;

               connection.query(addEventQuery, [event_name, event_date, categoryLower, description, venue_id, ticket_price, available_tickets], function (err, result) {
                  if (err) {
                     return connection.rollback(() => {
                        res.status(500).send({status: 500, success: false, message: err.message});
                     });
                  }

                  connection.commit((err) => {
                     if (err) {
                        return connection.rollback(() => {
                           res.status(500).send({status: 500, success: false, message: err.message});
                        });
                     }

                     res.status(200).send({
                        success: true,
                        message: 'Event and Venue added successfully!',
                        eventId: result.insertId,
                        venueId: venue_id
                     });
                  });
               })
            })
         })
      })
   })
}))

export default router;