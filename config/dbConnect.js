const mongoose = require('mongoose');
require('dotenv').config();


const dbConnect = async (dbName) => {
    try {
        const mongoURL = `${process.env.MONGODB_URL}${dbName}?retryWrites=true&w=majority`;
        await mongoose.connect(mongoURL, { useUnifiedTopology: true });
        console.log(`Connected to database: ${dbName}`);
    } catch (error) {
        console.error('Error connecting to DB:', error);
    }
};

module.exports = dbConnect;

