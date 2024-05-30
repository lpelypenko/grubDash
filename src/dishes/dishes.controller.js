const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newId = nextId();
  // console.log("newId:", newId);
  const newDish = {
    id: newId,
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Must include a ${propertyName}` });
  };
}

function bodyDataHasNotEmpty(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName].length > 0) {
      return next();
    }
    next({ status: 400, message: `${propertyName} property is empty ""` });
  };
}

function priceIsValidNumber(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (!Number.isInteger(price) || price <= 0) {
    return next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0",
    });
  }
  next();
}

function idInRouteIsSameAsInBody(req, res, next) {
  const { data: { id } = {} } = req.body;
  const { dishId } = req.params;
  if (id && id != dishId) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }
  next();
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  //console.log("reseived dishId:", dishId);
  const foundDish = dishes.find((dish) => dish.id === dishId);
  //console.log("foundDish:", foundDish);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}`,
  });
}

function list(req, res) {
  res.json({ data: dishes });
}

function read(req, res) {
  const dish = res.locals.dish;
  res.json({ data: dish });
}

function update(req, res) {
  console.log("update");
  const foundDish = res.locals.dish;

  const { data: { name, description, price, image_url } = {} } = req.body;

  foundDish.name = name;
  foundDish.description = description;
  foundDish.price = price;
  foundDish.image_url = image_url;

  res.json({ data: foundDish });
}

module.exports = {
  create: [
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    bodyDataHasNotEmpty("name"),
    bodyDataHasNotEmpty("description"),
    bodyDataHasNotEmpty("image_url"),
    priceIsValidNumber,
    create,
  ],
  list,
  read: [dishExists, read],
  update: [
    dishExists,
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    bodyDataHasNotEmpty("name"),
    bodyDataHasNotEmpty("description"),
    bodyDataHasNotEmpty("image_url"),
    idInRouteIsSameAsInBody,
    priceIsValidNumber,
    update,
  ],
};
