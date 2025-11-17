import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProjectsAndTransactions1761741572000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns to users table
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "phone" character varying,
      ADD COLUMN IF NOT EXISTS "role" character varying NOT NULL DEFAULT 'user'
    `);

    // Create projects table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "projects" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "description" text NOT NULL,
        "category" character varying NOT NULL DEFAULT 'other',
        "price" numeric(10,2) NOT NULL,
        "image" character varying,
        "images" text,
        "tags" text,
        "features" text,
        "techStack" text,
        "demoUrl" character varying,
        "documentationUrl" character varying,
        "views" integer NOT NULL DEFAULT 0,
        "downloads" integer NOT NULL DEFAULT 0,
        "sales" integer NOT NULL DEFAULT 0,
        "status" character varying NOT NULL DEFAULT 'draft',
        "sellerId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_projects" PRIMARY KEY ("id"),
        CONSTRAINT "FK_projects_seller" FOREIGN KEY ("sellerId")
          REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    // Create custom_requests table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "custom_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "projectTitle" character varying NOT NULL,
        "description" text NOT NULL,
        "projectType" character varying NOT NULL,
        "requiredFeatures" text,
        "technicalRequirements" text,
        "budgetInINR" numeric(10,2) NOT NULL,
        "expectedDeliveryDate" date,
        "status" character varying NOT NULL DEFAULT 'pending',
        "adminNotes" text,
        "quotedPrice" numeric(10,2),
        "estimatedDays" integer,
        "attachments" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_custom_requests" PRIMARY KEY ("id"),
        CONSTRAINT "FK_custom_requests_user" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    // Create transactions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "projectId" uuid,
        "customRequestId" character varying,
        "type" character varying NOT NULL,
        "amount" numeric(10,2) NOT NULL,
        "currency" character varying(3) NOT NULL DEFAULT 'INR',
        "status" character varying NOT NULL DEFAULT 'pending',
        "paymentMethod" character varying,
        "transactionReference" character varying,
        "paymentGatewayOrderId" character varying,
        "paymentGatewayPaymentId" character varying,
        "description" text,
        "failureReason" text,
        "metadata" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transactions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_transactions_user" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_transactions_project" FOREIGN KEY ("projectId")
          REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    // Create indexes for better query performance
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_projects_category" ON "projects" ("category")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_projects_status" ON "projects" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_projects_sellerId" ON "projects" ("sellerId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_custom_requests_userId" ON "custom_requests" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_custom_requests_status" ON "custom_requests" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_transactions_userId" ON "transactions" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_transactions_projectId" ON "transactions" ("projectId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_transactions_status" ON "transactions" ("status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_transactions_status"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_transactions_projectId"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_transactions_userId"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_custom_requests_status"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_custom_requests_userId"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_projects_sellerId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_projects_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_projects_category"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "transactions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "custom_requests"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "projects"`);

    // Remove columns from users table
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "role",
      DROP COLUMN IF EXISTS "phone"
    `);
  }
}
