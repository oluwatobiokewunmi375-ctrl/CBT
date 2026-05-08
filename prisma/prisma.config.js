const databaseUrl = process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/appdb";

module.exports = {
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
};