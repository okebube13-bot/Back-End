const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");
const multer = require("multer");
const path = require("path");

cloudinary.config({
  cloud_name: process.env.CLOUDNAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// const upload = multer({ dest: "uploads/" });
const upload = multer({ storage });

module.exports = { cloudinary, upload };
