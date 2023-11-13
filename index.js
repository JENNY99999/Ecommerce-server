const express = require('express');
const cors = require('cors')
const cookieParser = require("cookie-parser")
const bodyParser = require('body-parser')
const morgan = require("morgan")
const dbConnect = require('./config/dbConnect')

const authRouter = require('./routes/authRoute')
const productRouter = require("./routes/productRoute");
const brandRouter = require("./routes/brandRoute");
const categoryRouter = require("./routes/prodcategoryRoute");
const colorRouter = require("./routes/colorRoute");
const enqRouter = require("./routes/enqRoute");
const { notFound, errorHandler } = require('./middlewares/errorHandler')
const uploadRouter = require("./routes/uploadRoute");


require('dotenv').config()
const app = express();
const PORT = process.env.PORT || 4000




//Connect to MongoDB 
const dbName = 'shopdata';
dbConnect(dbName);

//Middlewares
app.use(morgan("dev"))
app.use(cookieParser())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cors())

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.use("/api/user", authRouter)
app.use("/api/product", productRouter)
app.use("/api/brand", brandRouter)
app.use("/api/category", categoryRouter)
app.use("/api/color", colorRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/enquiry", enqRouter);

app.use(notFound)
app.use(errorHandler)



app.listen(PORT, () => {
    console.log(`Server is running at PORT ${PORT}`);
});

