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
  const location = new Location(city, locationData);
  response.status(200).send(location);
}

function restaurantHandler(request, response) {
  // const latitude = request.query.latitude;
  // const longitude = request.query.longtude;
  const locationData = require('./data/restaurants.json');
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
  this.search_query = city;
  this.formatted_query = locationData[0].display_name;
  this.latitude = locationData[0].lat;
  this.longitude = locationData[0].lon;
}

function Restaurant(restaurantData) {
  this.url = restaurantData.restaurant.url;
  this.name = restaurantData.restaurant.name;
  this.rating = restaurantData.restaurant.user_rating.aggregate_rating;
  this.price = restaurantData.restaurant.price_range;
  this.image_url = restaurantData.restaurant.featured_image;
}

// App listener
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
