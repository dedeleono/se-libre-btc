import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    return undefined
  }

  try {
    const url = new URL(databaseUrl)
    const isSupabasePooler =
      url.hostname.includes('pooler.supabase.com') || url.port === '6543'

    // Prisma's PgBouncer flag is case-sensitive. Supabase examples/old envs
    // sometimes end up with `pgBouncer=true`, which Prisma ignores and then
    // crashes behind the transaction pooler with "prepared statement ... does not exist".
    if (url.searchParams.has('pgBouncer')) {
      url.searchParams.delete('pgBouncer')
      url.searchParams.set('pgbouncer', 'true')
    }

    if (isSupabasePooler && !url.searchParams.has('pgbouncer')) {
      url.searchParams.set('pgbouncer', 'true')
    }

    return url.toString()
  } catch {
    return databaseUrl
  }
}

const databaseUrl = getDatabaseUrl()

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.PRISMA_DEBUG === 'true' ? ['query', 'error', 'warn'] : ['error', 'warn'],
  ...(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {}),
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
