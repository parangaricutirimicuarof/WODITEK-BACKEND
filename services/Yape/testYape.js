import express from 'express';
import router from './yapeRouter.js';
import fetch from 'node-fetch';
import { getConnection } from '../sqlconfig.js';

const app = express();
app.use(express.json());
app.use('/yape', router);

async function runTests() {
  console.log("Running Yape Router Tests (with new SQL Server Schema)...");
  
  let pool;
  try {
    pool = await getConnection();
    console.log("Database connection successful. Migrating table 'yape_payments' if old schema exists...");
    
    // Check if table has the obsolete security_code column and drop it to align with the new schema
    await pool.request().query(`
      IF EXISTS (SELECT * FROM sysobjects WHERE name='yape_payments' AND xtype='U')
      BEGIN
          IF EXISTS (SELECT * FROM syscolumns WHERE id=object_id('yape_payments') AND name='security_code')
          BEGIN
              DROP TABLE yape_payments;
              PRINT 'Dropped old yape_payments table containing security_code column.';
          END
          
          IF NOT EXISTS (SELECT * FROM syscolumns WHERE id=object_id('yape_payments') AND name='verified_sender')
          BEGIN
              ALTER TABLE yape_payments ADD verified_sender VARCHAR(255) NULL;
              PRINT 'Added verified_sender column to existing yape_payments table.';
          END
      END
    `);

    // Ensure new table schema exists
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='yape_payments' AND xtype='U')
      BEGIN
          CREATE TABLE yape_payments (
              id INT IDENTITY(1,1) PRIMARY KEY,
              amount DECIMAL(10, 2) NOT NULL,
              sender VARCHAR(255) DEFAULT 'Desconocido',
              is_used BIT DEFAULT 0,
              raw_text NVARCHAR(MAX) NULL,
              verified_sender VARCHAR(255) NULL,
              created_at DATETIME DEFAULT GETDATE(),
              used_at DATETIME NULL
          );
          CREATE NONCLUSTERED INDEX idx_yape_verify 
          ON yape_payments (amount, is_used, sender);
          PRINT 'New table yape_payments and index idx_yape_verify created.';
      END
      ELSE
      BEGIN
          PRINT 'Table yape_payments already exists with the new schema.';
      END
    `);
  } catch (dbError) {
    console.error("Failed to connect or initialize the database. Ensure SQL Server is running on localhost with credentials in .env.");
    console.error(dbError);
    process.exit(1);
  }

  // Start server on a dynamic port
  const server = app.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}/yape`;
    
    let initialCount = 0;
    
    try {
      // Get initial count of pending payments
      let res = await fetch(`${baseUrl}/pending-payments`);
      let json = await res.json();
      initialCount = json.count;
      console.log(`Initial pending payments count: ${initialCount}`);

      // Test 1: POST /yape-webhook (Raw simulator format)
      console.log("\n--- Test 1: Webhook Raw Simulator Format ---");
      res = await fetch(`${baseUrl}/yape-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: "Gabriel DB te envió S/ 15.00" })
      });
      json = await res.json();
      console.log("Status:", res.status);
      console.log("Response:", json);
      if (res.status !== 201 || !json.success) throw new Error("Test 1 Failed");

      // Verify payment is in pending list
      res = await fetch(`${baseUrl}/pending-payments`);
      json = await res.json();
      console.log("Pending Payments list:", json);
      const foundParsed = json.payments.find(p => p.sender === "Gabriel DB");
      if (!foundParsed || foundParsed.amount !== 15) {
        throw new Error("Pending payment verification for parsed webhook failed");
      }

      // Test 2: POST /yape-webhook (Raw text format via query parameters)
      console.log("\n--- Test 2: Webhook Raw Text Format (via Query Parameters) ---");
      const queryParams = new URLSearchParams({ rawText: "¡Te yapearon! Maria Gomez DB te envió S/. 25." });
      res = await fetch(`${baseUrl}/yape-webhook?${queryParams}`, {
        method: 'POST'
      });
      json = await res.json();
      console.log("Status:", res.status);
      console.log("Response:", json);
      if (res.status !== 201 || !json.success) throw new Error("Test 2 Failed");

      // Verify both payments are in pending list
      res = await fetch(`${baseUrl}/pending-payments`);
      json = await res.json();
      console.log("Pending Payments list after raw webhook:", json);
      const foundRaw = json.payments.find(p => p.sender === "Maria Gomez DB");
      if (!foundRaw || foundRaw.amount !== 25) {
        throw new Error("Pending payment verification for raw webhook failed");
      }

      // Test 3: POST /verify-payment (Successful validation)
      console.log("\n--- Test 3: Verify Payment (Success) ---");
      res = await fetch(`${baseUrl}/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 15.00, senderName: "Gabriel DB" })
      });
      json = await res.json();
      console.log("Status:", res.status);
      console.log("Response:", json);
      if (res.status !== 200 || !json.success) throw new Error("Test 3 Failed");

      // Test 4: POST /verify-payment (Re-verification should fail - double-spend / double-validation protection)
      console.log("\n--- Test 4: Re-verify Payment (Should fail to prevent double validation) ---");
      res = await fetch(`${baseUrl}/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 15.00, senderName: "Gabriel DB" })
      });
      json = await res.json();
      console.log("Status:", res.status);
      console.log("Response:", json);
      if (res.status !== 200 || json.success) throw new Error("Test 4 Failed - allowed double validation");

      // Test 5: Verify the raw text webhook payment with case/accent insensitivity (maría gómez db should match Maria Gomez DB)
      console.log("\n--- Test 5: Verify Raw Payment with Accent/Case Insensitivity (Success) ---");
      res = await fetch(`${baseUrl}/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 25.00, senderName: "maría gómez db" })
      });
      json = await res.json();
      console.log("Status:", res.status);
      console.log("Response:", json);
      if (res.status !== 200 || !json.success) throw new Error("Test 5 Failed");

      // Verify pending payments returned back to starting count (since we consumed our two test payments)
      res = await fetch(`${baseUrl}/pending-payments`);
      json = await res.json();
      console.log("Pending Payments at the end:", json);
      if (json.count !== initialCount) {
        throw new Error(`Expected pending payments count to be back to ${initialCount}`);
      }

      console.log("\nALL NEW DATABASE SCHEMA TESTS PASSED SUCCESSFULLY! ✅");
    } catch (err) {
      console.error("\nDATABASE TEST RUN FAILED ❌");
      console.error(err);
    } finally {
      // Clean up our test payments from the database to leave it tidy
      console.log("\nCleaning up test payments from the database...");
      try {
        await pool.request().query(`
          DELETE FROM yape_payments 
          WHERE sender IN ('Gabriel DB', 'Maria Gomez DB');
        `);
        console.log("Database cleanup complete.");
      } catch (cleanError) {
        console.error("Failed to clean up test database entries:", cleanError);
      }
      server.close();
      process.exit(0);
    }
  });
}

runTests();
