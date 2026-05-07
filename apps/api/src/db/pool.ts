import { Pool } from "pg";

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: parseInt(process.env.DB_POOL_MAX || "20"),
  min: parseInt(process.env.DB_POOL_MIN || "2"),
  idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || "30000"),
  connectionTimeoutMillis: parseInt(
    process.env.DB_POOL_CONNECTION_TIMEOUT || "2000"
  ),
  statement_timeout: 30000,
  query_timeout: 30000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

pool.on("connect", () => {
  console.log("New database connection established");
});

pool.on("remove", () => {
  console.log("Database connection removed from pool");
});

export default pool;