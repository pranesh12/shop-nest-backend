require("dotenv").config();
const stripe = require("stripe")(process.env.stripe_key);
const { v4: uuidv4 } = require("uuid");
const User = require("../models/userModel");
const Order = require("../models/orderModel");

exports.payment = async (req, res) => {
  const { totalAmount, token, currentUser, cartItems } = req.body;
  const idempotencyKey = uuidv4();

  try {
    const customer = await stripe.customers.create({
      email: token.email,
      source: token.id,
    });

    const charge = await stripe.charges.create(
      {
        amount: totalAmount * 100,
        currency: "usd",
        receipt_email: token.email,
        customer: customer.id,
      },
      { idempotencyKey }
    );

    if (charge) {
      Order.create({
        name: currentUser.name,
        email: token.email,
        orderAmount: totalAmount,
        orders: cartItems,
        userId: currentUser._id,
        shippingAddress: {
          city: token.card.address_country,
          streetAddress: token.card.address_line1,
        },
      });

      res.send({ message: "Payment successfull" });
    } else {
      res.send({ message: "Payment Failed" });
    }
  } catch (error) {
    res.send({ message: "Payment Failed" });
  }
};

exports.allOrder = async (req, res) => {
  const { email } = req.query;
  try {
    const admin = await User.find({ email: email });
    if ((admin.isAdmin = true)) {
      const orderList = await Order.find({});
      res.status(200).json(orderList);
    } else {
      res.status(400).json({ message: "something went wrong" });
    }
  } catch (error) {
    res.status(400).json(error);
  }
};

exports.userOrder = async (req, res) => {
  const { email } = req.query;
  try {
    const userOrderList = await Order.find({ email: email });
    res.status(200).json(userOrderList);
  } catch (error) {
    res.status(400).json(error);
  }
};
