const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

//Check if is Admin
const authMiddleware = asyncHandler(async (req, res, next) => {
    let token;

    // Check if the 'Authorization' header starts with 'Bearer'
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];

        try {
            if (token) {
                // Verify the token using the JWT_SECRET
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded?.id);
                req.user = user;
                next();
            }
        } catch (error) {
            throw new Error('Not Authorized Token Expired. Please Login Again');
        }
    } else {
        throw new Error('There is no token attached to header');
    }
});

const isAdmin = asyncHandler(async (req, res, next) => {
    const { email } = req.user
    const adminUser = await User.findOne({ email })
    if (adminUser.role !== "admin") {
        throw new Error('You are not an admin')
    } else {
        next()
    }
})
module.exports = { authMiddleware, isAdmin };
