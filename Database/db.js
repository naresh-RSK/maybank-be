const sql = require('mssql');
const PropertiesReader = require('properties-reader');
const path = require('path');

const properties = PropertiesReader(path.resolve(
    "..",
    "config",
    "config.properties"
  ));
//const properties = PropertiesReader('D:config/config.properties');
//const properties = PropertiesReader(configPath);
  
  let decodedBuffer = Buffer.from(properties.get('db.password'), "base64");
  let decodedPassword = decodedBuffer?.toString("utf-8");
console.log("System Admin password check:", decodedPassword);
const dbConfig = {
    user: properties.get('db.user'),
    password: decodedPassword,
    server: properties.get('db.server'),
    database: properties.get('db.database'),
    //port: properties.get('db.port'),
    // other options if needed
    options: {
              encrypt: false, // Disable encryption
              trustServerCertificate: true, // Change to false in production
          }
};

let pool;

async function connectToDatabase() {
    try {
        pool = await sql.connect(dbConfig);
        console.log('Connected to MSSQL');
        return pool;
    } catch (err) {
        console.error('Database connection failed:', err);
        throw err;  // Propagate the error for handling later
    }
}

function getPool() {
    if (!pool) {
        throw new Error('Database not connected');
    }
    return pool;
}

module.exports = { connectToDatabase, getPool };