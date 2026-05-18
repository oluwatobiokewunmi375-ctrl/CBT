import { resetTestDatabase } from "./db";

// Reset database between tests to ensure isolation
beforeEach(async () => {
  try {
    await resetTestDatabase();
  } catch (error) {
    console.warn("Database reset warning:", error);
  }
});
