import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL!

// Proteção para o Next.js não recriar a conexão a cada vez que você salva um arquivo (Hot Reload)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Se já existir uma conexão salva, usa ela. Se não, cria uma nova usando o adaptador do Neon.
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString }))
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma