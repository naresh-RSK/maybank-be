const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const https = require("https");
const passport = require("passport");
const cors = require("cors");

const { connectToDatabase } = require("./Database/db");
const { logger, requestLogger } = require("./utils/logger");
const { sendErrorMail } = require("./utils/sendEmailError");

const app = express();
const httpsPort = 8081;
const httpPort = 8080;

app.use(bodyParser.json());
app.use(express.json());
app.use(passport.initialize());
app.use(cors());
app.use(requestLogger); // Use the logger middleware


app.use((err, req, res, next) => {
    const errorMsg = `[${new Date().toISOString()}] ${err.stack}`;
    logger.error(errorMsg);
    sendErrorMail(errorMsg);
    res.status(500).json({
        message: errorMsg
    });
    return;
});

app.get('/serverCheck', (req, res) => {
    res.status(200).json({ message: 'Server is running' });
  });
// Ensure server starts immediately
app.get("/", (req, res) => {
    res.status(200).json({ message:"Backend is ready!"});
});
// Uncaught Exception Handling
process.on("uncaughtException", (err) => {
    const errorMsg = `[${new Date().toISOString()}] Uncaught Exception: ${err.stack}`;
    logger.error(errorMsg);
    sendErrorMail(errorMsg);
    process.exit(1);
});

// Unhandled Promise Rejections
process.on("unhandledRejection", (reason, promise) => {
    const errorMsg = `[${new Date().toISOString()}] Unhandled Rejection: ${reason}`;
    logger.error(errorMsg);
    sendErrorMail(errorMsg);
});

// Load API routes
const loginRouter = require("./routes/login");
const adminUserRouter = require("./routes/adminUser");
const userHistoryRouter = require("./routes/userHistory");
const unitCodeMapRouter = require("./routes/unitCodeMap");
const companyCodeMapRouter = require("./routes/companyCodeMap");
const eglAcCodeMapRouter = require("./routes/eglAcCodeMap");
const journalsRouter = require("./routes/journal");
const trailBalanceRouter = require("./routes/trailBalance");
const eglSummaryRouter = require("./routes/eglSummary");
const eglOutboundingRouter = require("./routes/eglOutbounding");
const eglRxceptionRouter = require("./routes/eglException");
const eglOutboundTrlrRouter = require("./routes/eglOutboundTrlr");
const emailTempateRouter = require("./routes/emailTemplate");
const baseSystemRouter = require("./routes/baseSystem");
const parametersRouter = require("./routes/parameters");
const passwordSecurityRouter = require("./routes/passwordSecurity");
const batchFileRouter = require("./routes/batchFile");
const reverseMappingRouter = require("./routes/reverseMapping");

app.use(express.static(path.join(__dirname, "public")));

// SSL options
const options = {
    key: fs.readFileSync("private.key"),
    cert: fs.readFileSync("certificate.crt")
};

// Database connection & server startup
connectToDatabase()
    .then(() => {
        app.use("/api/userAdmin", adminUserRouter);
        app.use("/api/userHistory", userHistoryRouter);
        app.use("/api/unitCodeMap", unitCodeMapRouter);
        app.use("/api/companyCodeMap", companyCodeMapRouter);
        app.use("/api/eglAcCodeMap", eglAcCodeMapRouter);
        app.use("/api/journals", journalsRouter);
        app.use("/api/trailBalance", trailBalanceRouter);
        app.use("/api/login", loginRouter);
        app.use("/api/eglSummary", eglSummaryRouter);
        app.use("/api/eglOutbounding", eglOutboundingRouter);
        app.use("/api/eglException", eglRxceptionRouter);
        app.use("/api/eglOutboundTrlr", eglOutboundTrlrRouter);
        app.use("/api/email", emailTempateRouter);
        app.use("/api/baseSystem", baseSystemRouter);
        app.use("/api/parameter", parametersRouter);
        app.use("/api/passwordSecurity", passwordSecurityRouter);
        app.use("/api/batchFile", batchFileRouter);
        app.use("/api/reverseMapping",reverseMappingRouter);

        app.listen(httpPort, () => {
            console.log(`Server running at http://localhost:${httpPort}`);
        });

        https.createServer(options, app).listen(httpsPort, () => {
            console.log(`Server running at https://localhost:${httpsPort}`);
        });

    })
    .catch(err => {
        console.error("Failed to start the server:", err);
    });
