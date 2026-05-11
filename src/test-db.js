require("dotenv").config();

const pool = require("./config/db");

async function testDB() {
  try {
    const result = await pool.query("SELECT * FROM users");

    console.log(result.rows);
  } catch (error) {
    console.error(error);
  }
}

testDB();