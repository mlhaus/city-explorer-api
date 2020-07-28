'use strict';

// Application Dependencies
const express = require('express');
require('dotenv').config();
const cors = require('cors');
const superagent = require('superagent');

// Application Setup
const app = express();
const PORT = process.env.PORT;
app.use(cors());

// Route Definitions
app.get('/', rootHandler);
app.get('/location', locationHandler);
app.get('/yelp', restaurantHandler);
app.use('*', notFoundHandler);
app.use(errorHandler);

// Route Handlers
function rootHandler(request, response) {
  response.status(200).send('City Explorer App');
}

function locationHandler(request, response) {
  const city = request.query.city;
  const url = 'https://us1.locationiq.com/v1/search.php';
  superagent.get(url)
    .query({
      key: process.env.LOCATION_KEY,
      q: city,
      format: 'json'
    })
    .then(locationData => {
      const rawLocation = locationData.body[0];
      const location = new Location(city, rawLocation);
      response.status(200).send(location);
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

function notFoundHandler(request, response) {
  response.status(404).json({ notFound: true });
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

// App listener
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
