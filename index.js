const express = require('express');

const app = express();
const moment = require('moment');

const axios = require('axios');

const config = require('./config.json');

const db = require('./db');

// Initialize the app
app.set('port', (process.env.PORT || 5001));
app.get('/', (request, response) => {
  const result = 'App is running';
  response.send(result);
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
  console.log(`Updated at ${moment().toISOString()}`);
}, 30000);
