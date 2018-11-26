const express = require('express');
const app = express();
const moment = require('moment');
const { Pool, Client } = require('pg');
const axios = require('axios');
const config = require('./config.json');

// Initialize the app
app.set('port', (process.env.PORT || 5000));

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
    const client = new Client({
        connectionString: 'postgres://psxlgurcfcqdhz:66544c0410a75ff78a8b7322c642b4a98a298603d626a1be669df5c71814a891@ec2-54-246-85-234.eu-west-1.compute.amazonaws.com:5432/dadshomla2a967',
        ssl: true
    });
    const text = 'INSERT INTO locationHistory(car, latitude, longitude, time, status) VALUES($1, $2, $3, $4, $5)';
    await client.connect();
    for(var i=0;i<vehicles.length;i++) {
        const values = [vehicles[i].platesNumber, vehicles[i].location.latitude, vehicles[i].location.longitude, moment().toISOString(), vehicle[i].status];
        client.query(text, values, (err, res) => {
            if(err) {
                console.log(err.stack);
            } else {
                console.log(res)
            }
        });
    }
    client.end();
}
const instance = createVozillaInstance(config.instanceParams);
getCars(instance, config.requestParams);
