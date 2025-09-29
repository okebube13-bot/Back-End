const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const port = 8000;
require("dotenv").config();
const blog = require("./Models/Schema");
const { deleteBlog, updateBlog } = require("./Modules/CRUD");

// const User = require("./Schema");

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Mongo connected successfully"))
  .catch((err) => console.log("❌ Failed to connect to Mongo", err));

app.post("/posts", async (req, res) => {
  try {
    const { title, body, author } = req.body;
    const newBlogs = new blog({ title, body, author });
    await newBlogs.save();
    res.render("NewBlog", { blogs: [newBlogs] });
  } catch (err) {
    res
      .status(500)
      .json({ err: "❌ Failed to post blog. Please try again!!!" });
  }
});

app.get("/posts/new", async (req, res) => {
  try {
    const blogs = await blog.find();
    res.render("NewBlog", { blogs: blogs });
  } catch (err) {
    res.status(500).json({ err: "Failed to fetch blogs" });
  }
});

app.get("/posts", async (req, res) => {
  try {
    const blogs = await blog.find();

    res.render("index", { blogs: blogs });
  } catch (err) {
    res.status(500).json({ err: "Failed to fetch blogs" });
  }
});

app.delete("/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await deleteBlog(id);
    res.status(200).json({ message: "✅ Blog deleted successfully" });
  } catch (err) {
    res.status(500).json({ err: " ❌ Failed to delete blog" });
  }
});

app.put("/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, body, author } = req.body;
    await updateBlog(id, { title, body, author });
    res.status(200).json({ message: "✅ Blog updated successfully" });
  } catch (err) {
    res.status(500).json({ err: " ❌ Failed to update blog" });
  }
});

app.listen(port, () =>
  console.log(`Server running at http://localhost:${port}`)
);
