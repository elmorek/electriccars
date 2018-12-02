const express = require('express');

const app = express();
const moment = require('moment');

const axios = require('axios');

const config = require('./config.json');

const db = require('./db');

const geoj = require('./geoj');

// Initialize the app
app.set('port', (process.env.PORT || 5001));
app.use('/static', express.static('static'));

function getEntries(callback) {
  const text = 'SELECT * from locationhistory';
  db.getClient((err, client, done) => {
    if (err) throw err;
    client.query(text, (err, res) => {
      callback(err, res);
      done();
    });
  });
}

app.get('/', (request, response) => {
  getEntries((err, res) => {
    if (err) throw err;
    let entries = '';
    for (let i = 0; i < res.rows.length; i += 1) {
      entries += `
        <tr>
          <td>${res.rows[i].car}</td>
          <td>${res.rows[i].latitude}</td>
          <td>${res.rows[i].longitude}</td>
          <td>${res.rows[i].time}</td>
          <td>${res.rows[i].status}</td>
        </tr>`;
    }
    response.send(`
      <html>
        <head>
          <style>
          table {
              font-family: arial, sans-serif;
              border-collapse: collapse;
              width: 100%;
          }

          td, th {
              border: 1px solid #dddddd;
              text-align: left;
              padding: 8px;
          }

          tr:nth-child(even) {
              background-color: #dddddd;
          }
          </style>
        </head>
        <body>
          <p>Number of entries: ${res.rowCount}</p>
          <table>
            <tr>
              <th>Car</th>
              <th>Latitude</th>
              <th>Longitude</th>
              <th>Time</th>
              <th>Status</th>
            </tr>
            ${entries}
          </table>
        </body>
      </html>
      `);
  });
}).listen(app.get('port'), () => {
  console.log('App is running');
});

function createVozillaInstance(instanceparams) {
  const instance = axios.create(instanceparams);
  return instance;
}

function writeEntry(vehicle) {
  const text = 'INSERT INTO locationhistory(car, latitude, longitude, time, status) VALUES($1, $2, $3, $4, $5)';
  const values = [
    vehicle.platesNumber,
    vehicle.location.latitude,
    vehicle.location.longitude,
    moment().toISOString(),
    vehicle.status,
  ];
  db.getClient((err, client, done) => {
    if (err) throw err.stack;
    client.query(text, values, (err, res) => {
      if (err) throw err.stack;
      done();
    });
  });
}

function writeData(response) {
  const { vehicles } = response.data;
  const entryCheck = 'SELECT (car, latitude, longitude) FROM locationhistory WHERE (car = $1 AND latitude = $2 AND longitude = $3)';
  for (let i = 0; i < vehicles.length; i += 1) {
    const entryCheckValues = [
      vehicles[i].platesNumber,
      vehicles[i].location.latitude,
      vehicles[i].location.longitude,
    ];
    db.getClient((err, client, done) => {
      if (err) throw err.stack;
      client.query(entryCheck, entryCheckValues, (err, res) => {
        if (err) throw err.stack;
        if (res.rowCount === 0) writeEntry(vehicles[i]);
        done();
      });
    });
  }
}

async function getCars(instance) {
  try {
    writeData(await instance.get('/map?objectType=VEHICLE'));
  } catch (error) {
    console.error(error);
  }
}

const reqinstance2 = createVozillaInstance(config.instanceParams);

getCars(reqinstance2, config.requestParams);

setInterval(() => {
  getCars(reqinstance2);
  geoj.getLocations((err, res) => {
    geoj.convertToGeoJSON(err, res);
  });
  console.log(`Updated at ${moment().toISOString()}`);
}, 30000);
