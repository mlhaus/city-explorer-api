'use strict';

// Application Dependencies
const express = require('express');
require('dotenv').config();
const cors = require('cors');

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
  const locationData = require('./data/location.json');
  // console.log(locationData);
  const location = new Location(city, locationData);
  response.status(200).send(location);
}

function restaurantHandler(request, response) {
  // const latitude = request.query.latitude;
  // const longitude = request.query.longtude;
  const locationData = require('./data/restaurants.json');
  // console.log(locationData);
  const arrayOfRestaurants = locationData.nearby_restaurants;
  const restaurantResults = [];
  arrayOfRestaurants.forEach((restaurant) => {
    restaurantResults.push(new Restaurant(restaurant));
  });
  response.send(restaurantResults);
}

function notFoundHandler(request, response) {
  response.status(404).json({ notFound: true });
}

function errorHandler(error, request, response, next) {
  response.status(500).json({ error: true, message: error.message });
}

// Helper Functions
function Location(city, locationData) {
  this.search_query = locationData.city;
  this.formatted_query = locationData.display_name;
  this.latitude = locationData.lat;
  this.longitude = locationData.lon;
}

function Restaurant(restaurantData) {
  this.url = restaurantData.url;
  this.name = restaurantData.name;
  this.rating = restaurantData.user_rating.aggregate_rating;
  this.price = restaurantData.price_range;
  this.image_url = restaurantData.featured_image;
}

// App listener
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
