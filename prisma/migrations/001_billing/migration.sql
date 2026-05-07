-- Update Subscription table
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "stripePriceId" TEXT;

-- Create Invoice table
CREATE TABLE IF NOT EXISTS "Invoice" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "subscriptionId" TEXT NOT NULL,
  "invoiceNumber" TEXT NOT NULL UNIQUE,
  "subtotal" DECIMAL(10,2) NOT NULL,
  "tax" DECIMAL(10,2) NOT NULL,
  "total" DECIMAL(10,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "status" TEXT NOT NULL DEFAULT 'draft',
  "stripeInvoiceId" TEXT,
  "stripePaymentIntentId" TEXT,
  "issuedDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dueDate" TIMESTAMP,
  "paidDate" TIMESTAMP,
  "lineItems" TEXT NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL,
  FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE
);

CREATE INDEX idx_invoice_subscription ON "Invoice"("subscriptionId");
CREATE INDEX idx_invoice_status ON "Invoice"("status");
CREATE INDEX idx_invoice_stripe ON "Invoice"("stripeInvoiceId");