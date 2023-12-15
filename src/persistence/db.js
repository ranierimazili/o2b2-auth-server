import { config } from "../shared/config.js"
import MongoAdapter from "./types/mongodb.js"
import DynamoDBAdapter from "./types/dynamodb.js"
import MemoryAdapter from "./types/memorydb.js"


export const getDBAdapter = async function() {
    let adapter = null;

    if (config.db.type === "mongodb") {
        adapter = await MongoAdapter.connect();
    } else if (config.db.type === "dynamodb") {
        adapter = DynamoDBAdapter;
    } else if (config.db.type === "memorydb") {
        adapter = MemoryAdapter;
    } else {
        console.error("O tipo de banco de dados não foi configurado... abortando inicialização");
        process.exit(1);
    }
    
    return adapter;
}