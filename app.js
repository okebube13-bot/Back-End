const express = require("express");
const mongoose = require("mongoose");
const blog = require("./Models/Schema");
const cors = require("cors");
const app = express();
const dotenv = require("dotenv");
dotenv.config();

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Mongo connected successfully"))
  .catch((err) => console.log("❌ Failed to connect to Mongo", err));

app.get("/blogs", async (req, res) => {
  //   const { title, author, date } = req.query;

  const { limit } = req.query;
  try {
    // const blogs = await blog.find({ $or: [{ title }, { author }, { date }] });
    // const blogs = await blog.find().limit(parseInt(limit));
    const sortByDate = req.query.sort === "desc" ? -1 : 1;
    const blogs = await blog.find().sort();
    if (blogs.length === 0) {
      return res.status(404).json({ message: "No blogs found" });
    }
    res.status(200).json(blogs);
  } catch (err) {
    res.status(500).json({ err: "❌ Failed to fetch blogs" });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
});
