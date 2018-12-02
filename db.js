const { Pool } = require('pg');
const config = require('./config.json');

const pool = new Pool({
  connectionString: config.DATABASE_URL,
  ssl: false,
});

module.exports = {

  query: (text, params, callback) => {
    const start = Date.now();
    return pool.query(text, params, (err, res) => {
      const duration = Date.now() - start;
      console.log('executed query', { text, duration, rows: res.rowCount });
      callback(err, res);
    });
  },
  getClient: (callback) => {
    pool.connect((err, client, done) => {
      callback(err, client, done);
    });
  },
};
