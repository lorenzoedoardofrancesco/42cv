import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

export * from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient({ adapter });
} else {
  prisma = new PrismaClient({ adapter, log: ["query"] });
}

export default prisma;
