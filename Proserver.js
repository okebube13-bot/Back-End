const express = require("express");
const app = express();
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const { blog, User } = require("./Models/Schema");
const session = require("express-session");
const port = process.env.PORT;

app.use(methodOverride("_method"));
app.use(express.json());
app.use(cors());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Mongo connected successfully"))
  .catch((err) => console.log("❌ Failed to connect to Mongo", err));

app.get("/posts/new", isAuthenticated, async (req, res) => {
  try {
    res.render("newForm");
  } catch (err) {
    res.status(500).json({ err: "Failed to fetch blogs" });
  }
});

app.post("/posts", isAuthenticated, async (req, res) => {
  try {
    const { title, body, author } = req.body;
    const newBlog = new blog(req.body);
    await newBlog.save();
    res.render("newBlogs", { blogs: [newBlog] });
  } catch (error) {
    res.status(500).json({ err: "Failed to post blog. Please try again" });
  }
});

app.get("/posts", async (req, res) => {
  try {
    const Blog = await blog.find();
    res.render("allBlogs", { blogs: Blog });
  } catch (error) {
    res.status(500).json({ err: "Failed to fetch blogs" });
  }
});

app.get("/posts/:id/edit", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const singleBlog = await blog.findById(req.params.id);
    res.render("Editedblog", { blogs: singleBlog });
  } catch (error) {
    res.status(500).json({ err: "Failed to fetch blog for editing" });
  }
});

app.put("/posts/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    await blog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.redirect("/posts");
  } catch (error) {
    res.status(500).json({ error: "Failed to update blog" });
  }
});
app.delete("/posts/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    await blog.findByIdAndDelete(req.params.id);
    res.redirect("/posts");
    // console.log({ message: "Blog deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete blog" });
  }
});

function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  res.redirect("/login");
}

app.get("/signup", (req, res) => {
  res.render("Register");
});

app.post("/signup", async (req, res) => {
  try {
    const { Username, email, password } = req.body;
    const newUser = new User(req.body);
    await newUser.save();

    req.session.userId = newUser._id;

    // Force session save before redirect
    req.session.save((err) => {
      if (err) return res.status(500).send("❌ Could not save session");
      res.redirect("/posts");
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to register user" });
  }
});

app.get("/login", (req, res) => {
  res.render("Login");
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ error: "Invalid email or password" });
    }
    req.session.userId = user._id;
    res.redirect("/posts");
  } catch (error) {
    res.status(500).json({ error: "Failed to login user" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
