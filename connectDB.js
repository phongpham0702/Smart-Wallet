const mongoose = require("mongoose");

async function connect() {
  try {
    await mongoose.connect(
      "mongodb+srv://admin:abc123def456@cluster0.birq5k2.mongodb.net/SmartWalletDB?retryWrites=true&w=majority",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("Connect database successfully");
  } catch (error) {
    console.log("Connect database failure");
  }
}

module.exports = { connect };
