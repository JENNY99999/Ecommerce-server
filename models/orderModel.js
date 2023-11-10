const mongoose = require('mongoose')


const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  shippingInfo: {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    mobile: {
      type: String,
      required: true,
    },
    shippingOption: {
      type: Boolean,
      // required: true,
    },

  },
  paymentInfo: {


  },
  orderItems: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      color: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Color",
        required: true,
      },
      quantity: {
        type: Number,
        required: true
      },
      price: {
        type: Number,
        required: true
      },
      size: {
        type: String,
        required: true
      }
    }
  ],
  payAt: {
    type: Date,
    default: Date.now()
  },
  month: {
    type: String,
    default: new Date().getMonth()
  },
  totalPrice: {
    type: Number,
    required: true,
  },

  orderStatus: {
    type: String,
    default: "ordered"
  }
}, {
  timestamps: true,
});


module.exports = mongoose.model('Order', orderSchema);