import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1770397302754 implements MigrationInterface {
    name = 'InitSchema1770397302754'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."seats_status_enum" AS ENUM('AVAILABLE', 'RESERVED', 'SOLD')`);
        await queryRunner.query(`CREATE TABLE "seats" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "number" integer NOT NULL, "status" "public"."seats_status_enum" NOT NULL DEFAULT 'AVAILABLE', "sessionId" uuid, CONSTRAINT "PK_3fbc74bb4638600c506dcb777a7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_d2d1e4ed44632bca7fe92b2359" ON "seats" ("sessionId", "number") `);
        await queryRunner.query(`CREATE TABLE "sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "movieTitle" character varying NOT NULL, "startsAt" TIMESTAMP NOT NULL, "roomId" character varying NOT NULL, "price" numeric(10,2) NOT NULL, CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "reservation_seats" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "reservationId" uuid, "seatId" uuid, CONSTRAINT "PK_a8e72d786e30dcfdb3d44eccf95" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."reservations_status_enum" AS ENUM('ACTIVE', 'EXPIRED', 'CONFIRMED')`);
        await queryRunner.query(`CREATE TABLE "reservations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "status" "public"."reservations_status_enum" NOT NULL DEFAULT 'ACTIVE', "sessionId" uuid, CONSTRAINT "PK_da95cef71b617ac35dc5bcda243" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sales" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "totalAmount" numeric(10,2) NOT NULL, "createdAt" TIMESTAMP NOT NULL, CONSTRAINT "PK_4f0bc990ae81dba46da680895ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sale_seats" ("salesId" uuid NOT NULL, "seatsId" uuid NOT NULL, CONSTRAINT "PK_e0dbec85eb75bb9096f1bb4e701" PRIMARY KEY ("salesId", "seatsId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_240aab895d4c3b6e14ed6cea6c" ON "sale_seats" ("salesId") `);
        await queryRunner.query(`CREATE INDEX "IDX_d16a89d427e626c1a503755ff7" ON "sale_seats" ("seatsId") `);
        await queryRunner.query(`ALTER TABLE "seats" ADD CONSTRAINT "FK_c0489065c4695958dbf26cffdb2" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reservation_seats" ADD CONSTRAINT "FK_e147dea59deb12e5ab5069db857" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reservation_seats" ADD CONSTRAINT "FK_d6ea4f24beed8e9ae8e00773acc" FOREIGN KEY ("seatId") REFERENCES "seats"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reservations" ADD CONSTRAINT "FK_0ac485f0fc8618f8486c8481a44" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sale_seats" ADD CONSTRAINT "FK_240aab895d4c3b6e14ed6cea6cb" FOREIGN KEY ("salesId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "sale_seats" ADD CONSTRAINT "FK_d16a89d427e626c1a503755ff74" FOREIGN KEY ("seatsId") REFERENCES "seats"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sale_seats" DROP CONSTRAINT "FK_d16a89d427e626c1a503755ff74"`);
        await queryRunner.query(`ALTER TABLE "sale_seats" DROP CONSTRAINT "FK_240aab895d4c3b6e14ed6cea6cb"`);
        await queryRunner.query(`ALTER TABLE "reservations" DROP CONSTRAINT "FK_0ac485f0fc8618f8486c8481a44"`);
        await queryRunner.query(`ALTER TABLE "reservation_seats" DROP CONSTRAINT "FK_d6ea4f24beed8e9ae8e00773acc"`);
        await queryRunner.query(`ALTER TABLE "reservation_seats" DROP CONSTRAINT "FK_e147dea59deb12e5ab5069db857"`);
        await queryRunner.query(`ALTER TABLE "seats" DROP CONSTRAINT "FK_c0489065c4695958dbf26cffdb2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d16a89d427e626c1a503755ff7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_240aab895d4c3b6e14ed6cea6c"`);
        await queryRunner.query(`DROP TABLE "sale_seats"`);
        await queryRunner.query(`DROP TABLE "sales"`);
        await queryRunner.query(`DROP TABLE "reservations"`);
        await queryRunner.query(`DROP TYPE "public"."reservations_status_enum"`);
        await queryRunner.query(`DROP TABLE "reservation_seats"`);
        await queryRunner.query(`DROP TABLE "sessions"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d2d1e4ed44632bca7fe92b2359"`);
        await queryRunner.query(`DROP TABLE "seats"`);
        await queryRunner.query(`DROP TYPE "public"."seats_status_enum"`);
    }

}
