
const User = require("../models/userModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const uniqid = require("uniqid");

const { generateToken } = require('../config/jwtToken')
const asyncHandler = require("express-async-handler")
const { generateRefreshToken } = require("../config/refreshtoken");
const validateMongoDbId = require("../utils/validateMongodbId");
const crypto = require("crypto");

const jwt = require("jsonwebtoken");
const sendEmail = require("./emailCtrl");



// Create a User ----------------------------------------------

const createUser = asyncHandler(async (req, res) => {
    const email = req.body.email
    const findUser = await User.findOne({ email: email })//视频就是（email）
    if (!findUser) {
        //Create a new user
        const newUser = await User.create(req.body)
        res.json(newUser)
    } else {
        //User already exist
        throw new Error('User Already Exists')
    }
})


//Update a user
const updatedUser = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    validateMongoDbId(_id);
    const { name, email, mobile } = req.body;
    try {
        const findUpdateUser = await User.findByIdAndUpdate(
            _id,
            {
                name: name,
                email: email,
                mobile: mobile,
                // address: address
            },
            {
                new: true,
            }
        );
        return res.json(findUpdateUser);
    } catch (error) {
        throw new Error(error);
    }
});

//Login a user
const loginUserCtrl = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    // check if user exists or not
    const findUser = await User.findOne({ email });
    if (findUser && (await findUser.isPasswordMatched(password))) {
        const refreshToken = await generateRefreshToken(findUser?._id);
        const updateuser = await User.findByIdAndUpdate(
            findUser._id,
            {
                refreshToken: refreshToken,
            },
            { new: true }
        );
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            maxAge: 72 * 60 * 60 * 1000,
        });
        res.json({
            _id: findUser?._id,
            name: findUser?.name,
            email: findUser?.email,
            mobile: findUser?.mobile,
            token: generateToken(findUser?._id),
        });
    } else {
        throw new Error("Invalid Credentials");
    }
});


// admin login
const loginAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    // check if user exists or not
    const findAdmin = await User.findOne({ email });
    if (findAdmin.role !== "admin") throw new Error("Not Authorised");
    if (findAdmin && (await findAdmin.isPasswordMatched(password))) {
        const refreshToken = await generateRefreshToken(findAdmin?._id);
        const updateuser = await User.findByIdAndUpdate(
            findAdmin.id,
            {
                refreshToken: refreshToken,
            },
            { new: true }
        );
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            maxAge: 72 * 60 * 60 * 1000,
        });
        res.json({
            _id: findAdmin?._id,
            name: findAdmin?.name,

            email: findAdmin?.email,
            mobile: findAdmin?.mobile,
            token: generateToken(findAdmin?._id),
        });
    } else {
        throw new Error("Invalid Credentials");
    }
});



// handle refresh token
const handleRefreshToken = asyncHandler(async (req, res) => {
    const cookie = req.cookies;
    if (!cookie?.refreshToken) throw new Error("No Refresh Token in Cookies");
    const refreshToken = cookie.refreshToken;
    const user = await User.findOne({ refreshToken });
    if (!user) throw new Error(" No Refresh token present in db or not matched");
    jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
        if (err || user.id !== decoded.id) {
            throw new Error("There is something wrong with refresh token");
        }
        const accessToken = generateToken(user?._id);
        res.json({ accessToken });
    });
});



// logout functionality

const logout = asyncHandler(async (req, res) => {
    const cookie = req.cookies;
    if (!cookie?.refreshToken) throw new Error("No Refresh Token in Cookies");
    const refreshToken = cookie.refreshToken;
    const user = await User.findOne({ refreshToken });
    if (!user) {
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: true,
        });
        return res.sendStatus(204);
    }
    await User.findOneAndUpdate(refreshToken, {
        refreshToken: "",
    });
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
    });
    res.sendStatus(204);
});


// save user Address
const saveAddress = asyncHandler(async (req, res, next) => {
    const { id } = req.user;
    validateMongoDbId(id);
    try {
        const findUpdateUser = await User.findByIdAndUpdate(
            id,
            {
                address: req.body.address,
            },
            {
                new: true,
            }
        );
        return res.json(findUpdateUser);
    } catch (error) {
        throw new Error(error);
    }
});


//Get all users
const getallUser = asyncHandler(async (req, res) => {
    try {
        const getUsers = await User.find()
        res.json(getUsers)
    } catch (error) {
        throw new Error(error)
    }
})


//Get a single user
const getaUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    const findUser = await User.findById(id);
    try {
        return res.json(findUser);
    } catch (error) {
        throw new Error("User Not Found");
    }
});

//Delete a single user
const deleteaUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {
        const findDeleteUser = await User.findByIdAndDelete(id);
        return res.json(findDeleteUser);
    } catch (error) {
        throw new Error(error);
    }
});

//Password-----------------------------------
//update password
const updatePassword = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { password } = req.body;
    validateMongoDbId(_id);
    const user = await User.findById(_id);
    if (password) {
        user.password = password;
        const updatedPassword = await user.save();
        res.json(updatedPassword);
    } else {
        res.json(user);
    }
});

//passowrd
const forgotPasswordToken = asyncHandler(async (req, res) => {
    const { email } = req.body;
    console.log(email);
    const user = await User.findOne({ email });
    if (!user) throw new Error("User not found with this email");
    try {
        const resettoken = crypto.randomBytes(32).toString("hex");
        const token = crypto.createHash("sha256").update(resettoken).digest("hex");
        await User.findByIdAndUpdate(
            user?._id,
            {
                passwordResetToken: token,
                passwordResetExpires: Date.now() + 30 * 60 * 1000,
            },
            {
                new: true,
            }
        );

        const resetUrl = `Hi, please follow this link to reset your password. This link is valid for 10 minutes from now. <a href='http://localhost:3000/reset-password/${token}'>Click Here</a>`;
        const data = {
            to: email,
            text: "Hey, User",
            subject: "Forgot Password Link",
            html: resetUrl,
        };
        sendMail(data);
        res.json(token);
    } catch (error) {
        throw new Error(error);
    }
});

const resetPassword = asyncHandler(async (req, res) => {
    const myPassword = req.body.password.toString();
    const { token } = req.params;
    const user = await User.findOne({ passwordResetToken: token });
    if (!user) throw new Error("Token Expired, please try again later");
    const saltRound = 10;
    const salt = bcrypt.genSaltSync(saltRound);
    const hashPassword = bcrypt.hashSync(myPassword, salt);
    const findUser = await User.findByIdAndUpdate(
        user?._id,
        {
            password: hashPassword,
            passwordResetToken: "",
            passwordResetExpires: "",
        },
        {
            new: true,
        }
    );
    res.json(findUser);
});


//Cart----------------------------
// // Add to cart 原始的
const userCart = asyncHandler(async (req, res) => {
    const { productId, color, quantity, price, size } = req.body;
    const { _id } = req.user;

    validateMongoDbId(_id);
    try {

        let newCart = await new Cart({
            userId: _id,
            productId,
            color,
            price,
            quantity,
            size,
        }).save();
        res.json(newCart);
    } catch (error) {
        throw new Error(error);
    }
});


// // get user cart 原始数据
const getUserCart = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    validateMongoDbId(_id);
    try {
        const cart = await Cart.find({ userId: _id })
            .populate("productId")
            .populate("color");
        res.json(cart);
    } catch (error) {
        throw new Error(error);
    }
});


//Remove Item From Cart
const removeProductFromCart = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { cartItemId } = req.params;
    validateMongoDbId(_id);
    try {
        const deletedcartItem = await Cart.deleteOne({
            userId: _id,
            _id: cartItemId,
        });
        res.json(deletedcartItem);
    } catch (error) {
        throw new Error(error);
    }
});


// Update Product Quantity
const updateProductQuantity = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { cartItemId, quantity } = req.params;
    validateMongoDbId(_id);
    try {
        const cartItem = await Cart.findOne({ userId: _id, _id: cartItemId });
        cartItem.quantity = quantity;
        cartItem.save();
        res.json(cartItem);
    } catch (error) {
        throw new Error(error);
    }
});


//empty user cart
const emptyCart = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    validateMongoDbId(_id);
    try {
        const deletedcart = await Cart.deleteMany({ userId: _id });
        res.json(deletedcart);
    } catch (error) {
        throw new Error(error);
    }
});


// Order--------------------------------
//Create order
const createOrder = asyncHandler(async (req, res) => {
    const {
        shippingInfo,
        paymentInfo,
        orderItems,
        totalPrice,
    } = req.body;
    const { _id } = req.user;
    try {
        const order = await Order.create({
            shippingInfo,
            paymentInfo,
            orderItems,
            totalPrice,
            user: _id,
        });
        res.json(order);
    } catch (error) {
        throw new Error(error);
    }
});


//Get My Orders
const getOrders = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    try {
        const orders = await Order.find({ user: _id })
            .populate("user")
            .populate("orderItems.product")
            .populate("orderItems.color");
        res.json(orders);
    } catch (error) {
        throw new Error(error);
    }
});

const getAllOrders = asyncHandler(async (req, res) => {
    try {
        const alluserorders = await Order.find()
            .populate("products.product")
            .populate("orderby")
            .exec();
        res.json(alluserorders);
    } catch (error) {
        throw new Error(error);
    }
});



const getOrderByUserId = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {
        const userorders = await Order.findOne({ orderby: id })
            .populate("products.product")
            .populate("orderby")
            .exec();
        res.json(userorders);
    } catch (error) {
        throw new Error(error);
    }
});


const updateOrderStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const { id } = req.params;
    validateMongoDbId(id);
    try {
        const updateOrderStatus = await Order.findByIdAndUpdate(
            id,
            {
                orderStatus: status,
                paymentIntent: {
                    status: status,
                },
            },
            { new: true }
        );
        res.json(updateOrderStatus);
    } catch (error) {
        throw new Error(error);
    }
});




module.exports = {
    createUser,
    loginUserCtrl,
    getallUser,
    getaUser,
    deleteaUser,
    updatedUser,

    handleRefreshToken,
    logout,
    updatePassword,
    forgotPasswordToken,
    resetPassword,
    loginAdmin,

    saveAddress,
    userCart,
    getUserCart,
    emptyCart,
    removeProductFromCart,
    updateProductQuantity,

    createOrder,
    getOrders,
    updateOrderStatus,
    getAllOrders,
    getOrderByUserId,
}