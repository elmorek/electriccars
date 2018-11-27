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
    const entryCheck = 'SELECT (car, latitude, longitude) FROM locationhistory WHERE (car = $1 AND latitude = $2 AND longitude = $3)';
    for(var i=0;i<vehicles.length;i++) {
        const client = new Client({
            connectionString: config.DATABASE_URL,
            ssl: false
        });
        await client.connect();
        const entryCheckValues = [vehicles[i].platesNumber, vehicles[i].location.latitude, vehicles[i].location.longitude];
        client.query(entryCheck, entryCheckValues, (err, res) => {
            if(err) {
                console.log(err.stack);
            } else {
                if (res.rowCount === 0) {
                    writeEntry(vehicles[i]);
                }
            }
            client.end();
        });
        
    } 
}

async function writeEntry(vehicle) {
    const text = 'INSERT INTO locationhistory(car, latitude, longitude, time, status) VALUES($1, $2, $3, $4, $5)';
    const values = [vehicle.platesNumber, vehicle.location.latitude, vehicle.location.longitude, moment().toISOString(), vehicle.status];
    const client = new Client({
        connectionString: config.DATABASE_URL,
        ssl: false
    });
    await client.connect();
    client.query(text, values, (err, res) => {
        if(err) {
            console.log(err.stack);
        }
        client.end();
    });
}
const reqinstance2 = createVozillaInstance(config.instanceParams);

getCars(reqinstance2, config.requestParams);
setInterval(function() {
    getCars(reqinstance2, config.requestParams);
    console.log("Updated at "+moment().toISOString());
}, 30000)
