'use strict';

// Application Dependencies
const express = require('express');
require('dotenv').config();
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');

// Application Setup
const app = express();
const PORT = process.env.PORT;
app.use(cors());
if (!process.env.DATABASE_URL) {
  throw new Error('Missing database URL.');
}
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => { throw err; });

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

function getLocationData(city) {
  const SQL = `SELECT * FROM locations WHERE search_query = $1`;
  const values = [city];
  return client.query(SQL, values)
    .then(results => {
      if (results.rowCount > 0) {
        return results.rows[0];
      } else {
        const url = 'https://us1.locationiq.com/v1/search.php';
        return superagent.get(url)
          .query({
            key: process.env.LOCATION_KEY,
            q: city,
            format: 'json'
          })
          .then((data) => {
            return setLocationData(city, data.body[0]);
          });
      }
    });
}

function setLocationData(city, locationData) {
  const location = new Location(city, locationData);
  const SQL = `
    INSERT INTO locations (search_query, formatted_query, latitude, longitude)
    VALUES ($1, $2, $3, $4)
	  RETURNING *;
  `;
  const values = [city, location.formatted_query, location.latitude, location.longitude];
  return client.query(SQL, values)
    .then(results => {
      return results.rows[0];
    });
}

function restaurantHandler(request, response) {
  const lat = request.query.latitude;
  const lon = request.query.longitude;
  const page = parseInt(request.query.page);
  const restaurantsPerPage = 5;
  const start = ((page - 1) * restaurantsPerPage + 1);
  const url = 'https://api.yelp.com/v3/businesses/search';
  superagent.get(url)
    .query({
      latitude: lat,
      longitude: lon,
      limit: restaurantsPerPage,
      offset: start
    })
    .set('Authorization', `Bearer ${process.env.YELP_KEY}`)
    .then(restaurantData => {
      const arrayOfRestaurants = restaurantData.body.businesses;
      const restaurantResults = [];
      arrayOfRestaurants.forEach((restaurant) => {
        restaurantResults.push(new Restaurant(restaurant));
      });
      response.status(200).send(restaurantResults);
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
  response.status(404).sendFile('404.html');
}

function errorHandler(error, request, response, next) {
  response.status(500).json({ error: true, message: error.message });
}

// Helper Functions
function Location(city, locationData) {
  this.search_query = city;
  this.formatted_query = locationData.display_name;
  this.latitude = locationData.lat;
  this.longitude = locationData.lon;
}

function Restaurant(restaurantData) {
  this.url = restaurantData.url;
  this.name = restaurantData.name;
  this.rating = restaurantData.rating;
  this.price = restaurantData.price_range;
  this.image_url = restaurantData.image_url;
}

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

