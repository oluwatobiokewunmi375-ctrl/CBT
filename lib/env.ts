import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string()
    .min(1, "DATABASE_URL is required for database connection")
    .describe("PostgreSQL connection string. Format: postgresql://user:password@host:port/database"),
  JWT_SECRET: z.string()
    .min(32, "JWT_SECRET must be at least 32 characters for secure token signing")
    .describe("Secret key for JWT signing. Generate with: openssl rand -base64 32"),
  APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  REQUIRE_EMAIL_VERIFICATION: z.enum(["true", "false"]).default("false").optional(),
  DISABLE_RATE_LIMIT: z.enum(["true", "false"]).default("false").optional(),
  SENTRY_DSN: z.string().url().optional(),
  SUPER_ADMIN_SETUP_KEY: z.string().default("CBT_SETUP_2024").optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => {
      const path = issue.path.join(".");
      const message = issue.message;
      const schema = envSchema.shape[path as keyof typeof envSchema.shape];
      const description = (schema as any)?.description || "";
      return `${path}: ${message}${description ? `\n  → ${description}` : ""}`;
    })
    .join("\n\n");
  
  console.error(`\n❌ ENVIRONMENT VALIDATION FAILED:\n\n${issues}\n`);
  console.error("\nFix: Add missing variables to .env.local or deploy environment");
  console.error("Documentation: See .env.example for all required variables\n");
  
  throw new Error(`Environment validation failed. See errors above.`);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === "production";
