import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

export const getConnection = async () => {
    try {
        const connection = await pool.getConnection();
        return connection;
    } catch (err) {
        console.error("Error getting database connection:", err);
        throw err;
    }
};
