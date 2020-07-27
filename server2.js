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
  const restaurantsData = require('./data/restaurants.json');
  const arrayOfRestaurants = restaurantsData.nearby_restaurants;
  const restaurantsResults = [];
  arrayOfRestaurants.forEach(restaurantObj => {
    restaurantsResults.push(new Restaurant(restaurantObj));
  });
  response.send(restaurantsResults);
}
 
function notFoundHandler(request, response) {
  response.status(404).json({ notFound: true });
}
 
function errorHandler(error, request, response, next) {
  response.status(500).json({ error: true, message: error.message });
}
 
// Constructors
function Location(city, locationData) {
  this.search_query = city;
  this.formatted_query = locationData[0].display_name;
  this.latitude = parseFloat(locationData[0].lat);
  this.longitude = parseFloat(locationData[0].lon);
}
 
function Restaurant(obj) {
  this.name = obj.restaurant.name;
  this.url = obj.restaurant.url;
  this.rating = obj.restaurant.user_rating.aggregate_rating;
  this.price = obj.restaurant.price_range;
  this.image_url = obj.restaurant.featured_image;
}
 
// App listener
app.listen(PORT,() => console.log(`Listening on port ${PORT}`));