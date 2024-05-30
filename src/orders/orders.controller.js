const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order does not exist: ${orderId}`,
  });
}

function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newId = nextId();
  const newOrder = {
    id: newId,
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
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

function dishesPropertyValid(req, res, next) {
  const { data: { dishes } = [] } = req.body;
  if (!dishes || !Array.isArray(dishes) || dishes.length == 0) {
    return next({
      status: 400,
      message: "Order must include at least one dish",
    });
  }
  res.locals.dishes = dishes;
  next();
}

function dishesQtyPropertyValid(req, res, next) {
  let index = 0;
  for (const dish of res.locals.dishes) {
    if (
      !dish.hasOwnProperty("quantity") ||
      !Number.isInteger(dish.quantity) ||
      Number(dish.quantity) <= 0
    ) {
      return next({
        status: 400,
        message: `dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
    index++;
  }

  next();
}

function idInRouteIsSameAsInBody(req, res, next) {
  const { data: { id } = {} } = req.body;
  const { orderId } = req.params;
  if (id && id != orderId) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
    });
  }
  next();
}

function statusPropertyIsValid(req, res, next) {
  const { data: { status } = {} } = req.body;
  const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"];
  if (status && validStatus.includes(status)) {
    return next();
  }
  next({
    status: 400,
    message:
      "Order must have a status of pending, preparing, out-for-delivery, delivered",
  });
}

function deliveredStatusCannotBeChanged(req, res, next) {
  const order = res.locals.order;
  if (order != "delivered") {
    return next();
  }
  next({
    status: 400,
    message: "A delivered order cannot be changed",
  });
}

function onlyPendingCanBeDeleted(req, res, next) {
  const order = res.locals.order;
  if (order.status === "pending") {
    return next();
  }
  next({
    status: 400,
    message: "An order cannot be deleted unless it is pending.",
  });
}

function list(req, res) {
  res.json({ data: orders });
}

function read(req, res) {
  const order = res.locals.order;
  res.json({ data: order });
}

function update(req, res) {
  const foundOrder = res.locals.order;

  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  foundOrder.deliverTo = deliverTo;
  foundOrder.mobileNumber = mobileNumber;
  foundOrder.status = status;
  foundOrder.dishes = dishes;

  res.json({ data: foundOrder });
}

/**
 * Generally, a successful response to an HTTP DELETE method can be one of the following examples:
 * - 200 OK if the response includes a body describing the status.
 * - 202 Accepted if the action hasn't yet completed.
 * - 204 No Content if the action has been completed but the response doesn't include a body.
 */
function destroy(req, res) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === Number(orderId));
  // `splice()` returns an array of the deleted elements, even if it is one element
  orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    bodyDataHasNotEmpty("deliverTo"),
    bodyDataHasNotEmpty("mobileNumber"),
    dishesPropertyValid,
    dishesQtyPropertyValid,
    create,
  ],
  list,
  read: [orderExists, read],
  update: [
    orderExists,
    deliveredStatusCannotBeChanged,
    statusPropertyIsValid,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    bodyDataHasNotEmpty("deliverTo"),
    bodyDataHasNotEmpty("mobileNumber"),
    dishesPropertyValid,
    dishesQtyPropertyValid,
    idInRouteIsSameAsInBody,
    update,
  ],
  delete: [orderExists, onlyPendingCanBeDeleted, destroy],
};
