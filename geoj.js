const GeoJSON = require('geojson');

const fs = require('fs');

const db = require('./db');

module.exports = {

  getLocations: (callback) => {
    const text = 'SELECT * from locationhistory';
    db.getClient((err, client, done) => {
      if (err) throw err.stack;
      client.query(text, (err, res) => {
        callback(err, res);
        done();
      });
    });
  },

  convertToGeoJSON: (err, response) => {
    if (err) throw err.stack;
    fs.writeFile('static/vehicles.geojson', JSON.stringify(GeoJSON.parse(response.rows, { Point: ['latitude', 'longitude'] })), (err) => {
      if (err) throw err.stack;
    });
  },
};
