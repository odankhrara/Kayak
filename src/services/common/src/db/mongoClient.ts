import { MongoClient, Db } from 'mongodb'

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const dbName = process.env.MONGODB_DATABASE || 'kayak'

let client: MongoClient | null = null
let db: Db | null = null

export async function getMongoClient(): Promise<MongoClient> {
  if (!client) {
    client = new MongoClient(uri)
    await client.connect()
  }
  return client
}

export async function getMongoDb(): Promise<Db> {
  if (!db) {
    const client = await getMongoClient()
    db = client.db(dbName)
  }
  return db
}

export async function closeMongoConnection(): Promise<void> {
  if (client) {
    await client.close()
    client = null
    db = null
  }
}

