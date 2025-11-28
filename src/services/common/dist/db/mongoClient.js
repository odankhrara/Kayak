"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMongoClient = getMongoClient;
exports.getMongoDb = getMongoDb;
exports.closeMongoConnection = closeMongoConnection;
const mongodb_1 = require("mongodb");
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DATABASE || 'kayak';
let client = null;
let db = null;
async function getMongoClient() {
    if (!client) {
        client = new mongodb_1.MongoClient(uri);
        await client.connect();
    }
    return client;
}
async function getMongoDb() {
    if (!db) {
        const client = await getMongoClient();
        db = client.db(dbName);
    }
    return db;
}
async function closeMongoConnection() {
    if (client) {
        await client.close();
        client = null;
        db = null;
    }
}
//# sourceMappingURL=mongoClient.js.map