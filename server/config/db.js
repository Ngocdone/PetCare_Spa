const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/petspa', {
      // Mongoose 6+ không cần useNewUrlParser, useUnifiedTopology
    });
    console.log(`MongoDB kết nối: ${conn.connection.host}`);
  } catch (error) {
    console.error('Lỗi kết nối MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
