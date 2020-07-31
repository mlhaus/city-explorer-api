'use strict';

// Application Dependencies
const express = require('express');
require('dotenv').config();
const cors = require('cors');
const superagent = require('superagent');

// My Dependencies
const client = require('./modules/client');
const getLocationData = require('./modules/location');
const getRestaurantData = require('./modules/yelp');

// Application Setup
const app = express();
const PORT = process.env.PORT;
app.use(cors());

// Route Definitions
app.get('/', rootHandler);
app.get('/location', locationHandler);
app.get('/yelp', restaurantHandler);
app.get('/trails', hikingHandler);
app.use('*', notFoundHandler);
app.use(errorHandler);

// Route Handlers
function rootHandler(request, response) {
  response.status(200).send('City Explorer App');
}

function locationHandler(request, response) {
  const city = request.query.city;
  getLocationData(city)
    .then(locationData => {
      response.status(200).send(locationData);
    })
    .catch(err => {
      console.log(err);
      errorHandler(err, request, response);
    });
}

function restaurantHandler(request, response) {
  const lat = request.query.latitude;
  const lon = request.query.longitude;
  const page = parseInt(request.query.page);
  getRestaurantData(lat, lon, page)
    .then(restaurantData => {
      response.status(200).send(restaurantData);
    })
    .catch(err => {
      console.log(err);
      errorHandler(err, request, response);
    });
}

function hikingHandler(request, response) {
  const latitude = request.query.latitude;
  const longitude = request.query.longitude;
  const url = 'https://www.hikingproject.com/data/get-trails';
  superagent.get(url)
    .query({
      key: process.env.TRAILS_KEY,
      lat: latitude,
      lon: longitude,
      maxDistance: 60
    })
    .then((trailsAPIData) => {
      const arrayOfTrails = trailsAPIData.body.trails;
      const trailResults = arrayOfTrails.map(trail => new Trail(trail));
      response.status(200).send(trailResults);
    })
    .catch(err => {
      console.log(err);
      errorHandler(err, request, response);
    });
}

function notFoundHandler(request, response) {
  response.status(404).send({ notFound: true, message: 'Not Found'});
}

function errorHandler(error, request, response, next) {
  response.status(500).json({ error: true, message: error.message });
}

// Helper Functions
function Trail(trail) {
  this.name = trail.name;
  this.location = trail.location;
  this.length = trail.length;
  this.stars = trail.stars;
  this.star_votes = trail.starVotes;
  this.summary = trail.summary;
  this.trail_url = trail.url;
  this.conditions = trail.conditionDetails;
  this.condition_date = trail.conditionDate.slice(0, 10);
  this.condition_time = trail.conditionDate.slice(12);
}

// App listener
client.connect()
  .then(() => {
    console.log('Postgres connected.');
    app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
  })
  .catch(err => {
    throw `Postgres error: ${err.message}`;
  });

