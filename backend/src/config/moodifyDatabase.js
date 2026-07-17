const mongoose = require("mongoose");

function connectToDb() {
    mongoose.connect(process.env.URL)
        .then(() => {
            console.log("Database connected");
        })
        .catch((err) => {
            console.error("Database connection failed:", err);
        });
}

module.exports.connectToDb = connectToDb;