import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

export * from "@prisma/client";

const connectionString = process.env.DATABASE_URL?.replace(/sslmode=(?:prefer|require)\b/, "sslmode=no-verify");
const adapter = new PrismaPg({ connectionString });

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient({ adapter });
} else {
  prisma = new PrismaClient({ adapter, log: ["query"] });
}

export default prisma;
