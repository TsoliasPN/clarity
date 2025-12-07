import { PrismaClient, CycleType, Status } from '@prisma/client'

const prisma = new PrismaClient()

// Base: USD = 1.0
const INITIAL_RATES = [
  { code: 'USD', rate: 1.0 },
  { code: 'EUR', rate: 0.94 }, // Euro
  { code: 'GBP', rate: 0.82 }, // British Pound
  { code: 'JPY', rate: 149.5 }, // Japanese Yen
  { code: 'CAD', rate: 1.37 }, // Canadian Dollar
  { code: 'AUD', rate: 1.56 }, // Australian Dollar
  { code: 'CHF', rate: 0.90 }, // Swiss Franc
  { code: 'CNY', rate: 7.30 }, // Chinese Yuan
  { code: 'HKD', rate: 7.82 }, // Hong Kong Dollar
  { code: 'NZD', rate: 1.70 }, // New Zealand Dollar
  { code: 'SEK', rate: 11.0 }, // Swedish Krona
  { code: 'KRW', rate: 1350.0 }, // South Korean Won
  { code: 'SGD', rate: 1.37 }, // Singapore Dollar
  { code: 'NOK', rate: 11.1 }, // Norwegian Krone
  { code: 'MXN', rate: 18.0 }, // Mexican Peso
  { code: 'INR', rate: 83.2 }, // Indian Rupee
  { code: 'RUB', rate: 93.5 }, // Russian Ruble
  { code: 'ZAR', rate: 19.0 }, // South African Rand
  { code: 'TRY', rate: 28.0 }, // Turkish Lira
  { code: 'BRL', rate: 5.05 }, // Brazilian Real
]

const DEMO_USER_ID = 'demo-user'
const DEMO_USER_EMAIL = 'demo@clarity.test'
const DEMO_BASE_CURRENCY = 'GBP'

const DEMO_SUBSCRIPTIONS = [
  {
    name: 'Netflix',
    provider: 'Netflix',
    cost: 15.99,
    currency: 'USD',
    billingCycle: CycleType.MONTHLY,
    startDate: new Date('2024-09-01'),
    nextBillDate: new Date('2025-07-01'),
    status: Status.ACTIVE,
    category: 'Streaming',
    description: '4K family plan paid in USD'
  },
  {
    name: 'Spotify',
    provider: 'Spotify',
    cost: 12.99,
    currency: 'EUR',
    billingCycle: CycleType.MONTHLY,
    startDate: new Date('2024-08-12'),
    nextBillDate: new Date('2025-07-12'),
    status: Status.ACTIVE,
    category: 'Music',
    description: 'Personal plan billed in EUR'
  },
  {
    name: 'Adobe Creative Cloud',
    provider: 'Adobe',
    cost: 599.0,
    currency: 'GBP',
    billingCycle: CycleType.YEARLY,
    startDate: new Date('2024-12-01'),
    nextBillDate: new Date('2025-12-01'),
    status: Status.ACTIVE,
    category: 'Design',
    description: 'Annual prepaid license in base currency'
  },
  {
    name: 'Duolingo Super',
    provider: 'Duolingo',
    cost: 3.49,
    currency: 'EUR',
    billingCycle: CycleType.WEEKLY,
    startDate: new Date('2025-03-15'),
    nextBillDate: new Date('2025-06-22'),
    status: Status.PAUSED,
    category: 'Education',
    description: 'Weekly plan to exercise weekly -> monthly normalization is useful'
  },
  {
    name: 'Atlassian Jira',
    provider: 'Atlassian',
    cost: 36.0,
    currency: 'USD',
    billingCycle: CycleType.MONTHLY,
    startDate: new Date('2024-10-03'),
    nextBillDate: new Date('2025-07-03'),
    status: Status.ACTIVE,
    category: 'Productivity',
    description: 'Team plan for product delivery'
  },
  {
    name: 'Figma',
    provider: 'Figma',
    cost: 12000,
    currency: 'JPY',
    billingCycle: CycleType.MONTHLY,
    startDate: new Date('2024-11-10'),
    nextBillDate: new Date('2025-07-10'),
    status: Status.ACTIVE,
    category: 'Design',
    description: 'Billed in JPY to demonstrate FX conversion'
  },
  {
    name: 'Notion',
    provider: 'Notion',
    cost: 99.0,
    currency: 'USD',
    billingCycle: CycleType.QUARTERLY,
    startDate: new Date('2025-01-05'),
    nextBillDate: new Date('2025-07-05'),
    status: Status.ACTIVE,
    category: 'Knowledge',
    description: 'Quarterly billing for business workspace'
  }
]

async function main() {
  console.log(`Start seeding exchange rates...`)

  for (const currency of INITIAL_RATES) {
    const exchangeRate = await prisma.exchangeRate.upsert({
      where: { currencyCode: currency.code },
      update: {
        rateToUSD: currency.rate,
        lastUpdated: new Date(), 
      },
      create: {
        currencyCode: currency.code,
        rateToUSD: currency.rate,
      },
    })
    console.log(`Upserted rate for: ${exchangeRate.currencyCode}`)
  }

  console.log(`Seeding demo user & subscriptions...`)
  const demoUser = await prisma.user.upsert({
    where: { email: DEMO_USER_EMAIL },
    update: { baseCurrency: DEMO_BASE_CURRENCY },
    create: { id: DEMO_USER_ID, email: DEMO_USER_EMAIL, baseCurrency: DEMO_BASE_CURRENCY }
  })
  console.log(`Ensuring subscriptions for user ${demoUser.email} (${demoUser.id})`)

  await prisma.subscription.deleteMany({ where: { userId: demoUser.id } })

  for (const sub of DEMO_SUBSCRIPTIONS) {
    const subscription = await prisma.subscription.create({
      data: {
        ...sub,
        userId: demoUser.id
      }
    })
    console.log(`Created subscription: ${subscription.name} (${subscription.currency})`)
  }

  console.log(`Seeding finished.`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
