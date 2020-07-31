'use strict';

const superagent = require('superagent');

function getRestaurantData(lat, lon, page) {
  const restaurantsPerPage = 5;
  const start = ((page - 1) * restaurantsPerPage + 1);
  const url = 'https://api.yelp.com/v3/businesses/search';
  return superagent.get(url)
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
      return restaurantResults;
    });
}

function Restaurant(restaurantData) {
  this.url = restaurantData.url;
  this.name = restaurantData.name;
  this.rating = restaurantData.rating;
  this.price = restaurantData.price_range;
  this.image_url = restaurantData.image_url;
}

module.exports = getRestaurantData;