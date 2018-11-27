const express = require('express');
const app = express();
const moment = require('moment');
const { Pool, Client } = require('pg');
const axios = require('axios');
const config = require('./config.json');

// Initialize the app
app.set('port', (process.env.PORT || 5001));

app.get('/', function(request, response) {
    const result = 'App is running';
    response.send(result);
  }).listen(app.get('port'), function() {
    console.log('App is running, server is listening on port ', app.get('port'));
  });

function createVozillaInstance(instanceparams) {
    const instance = axios.create(instanceparams);
    return instance;
}

async function getCars(instance, requestParams) {
    try {
        const response = writeData(await instance.get("/map?objectType=VEHICLE"));
    } catch(error) {
        console.error(error)
    }
    

}

async function writeData(response) {
    const vehicles = response.data.vehicles;
    const text = 'INSERT INTO locationhistory(car, latitude, longitude, time, status) VALUES($1, $2, $3, $4, $5)';
    for(var i=0;i<vehicles.length;i++) {
        const client = new Client({
            connectionString: config.DATABASE_URL,
            ssl: true
        });
        await client.connect();
        const values = [vehicles[i].platesNumber, vehicles[i].location.latitude, vehicles[i].location.longitude, moment().toISOString(), vehicles[i].status];
        client.query(text, values, (err, res) => {
            if(err) {
                console.log(err.stack);
            } else {
                console.log(vehicles[i].platesNumber+" added")
            }
            client.end();
        });
    }
    
}
const instance = createVozillaInstance(config.instanceParams);
getCars(instance, config.requestParams);
