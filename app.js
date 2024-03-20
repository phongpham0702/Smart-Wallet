const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");
// const logger = require("morgan");
const dotenv = require("dotenv");
const hbs = require("express-handlebars");
const session = require("express-session");
// const jwt = require("jsonwebtoken");

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const adminRouter = require("./routes/admin");
dotenv.config("./.env");
const app = express();

//Connect Database
const DB = require("./connectDB");
const authController = require("./controllers/authController");
const { type } = require("os");
const { handlebars } = require("hbs");
DB.connect();

// view engine setup
app.engine("hbs", hbs.engine({ extname: ".hbs", defaultLayout: "main" }));
app.set("view engine", "hbs");
app.use(cors());
const hbsCreate = hbs.create({});
hbsCreate.handlebars.registerHelper('ifCond', (status, options) => {

        let result = `<span id="role" class="header-profile-fs-2">`
        if(!status)
        {      
            result += "Không xác định được trạng thái.Vui lòng đăng nhập lại. </span>" 
            return result;
        }    
        if(status.toLowerCase() === "pending")
        {
            result += "Tài khoản chờ kích hoạt"
        }
        else if(status.toLowerCase() === "activated")
        {
            result += "Tài khoản đã kích hoạt"
        }
        else if(status.toLowerCase() ==="adminstatus")
        {
            result += "Tài khoản quản trị viên"
        }
        else
        {
            result += `Không xác định được trạng thái`
        }
        result += `</span>`
        return new handlebars.SafeString(result)
});

// app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(express.static(__dirname + "/public"));
app.use(
    session({
        resave: true,
        saveUninitialized: true,
        secret: "somesecret",
    })
);
app.use((req, res, next) => {
    // res.cookie()
    res.locals.flash = req.session.flash;
    delete req.session.flash;
    next();
});

app.use("/", indexRouter);

app.use("/users", usersRouter);
app.use("/admin", adminRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
    next(createError(404));
  });
app.use((err, req, res, next) => {
    req.session.destroy()
    return res.render("404", { layout: null });
});
  
module.exports = app;