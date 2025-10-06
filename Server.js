const express = require("express");
const app = express();
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
dotenv.config();
const { blog, User } = require("./Models/Schema");
const session = require("express-session");
const port = process.env.PORT;
const { cloudinary, upload } = require("./Cloudinary");
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
app.use("/uploads", express.static("uploads"));
app.use(express.urlencoded({ extended: true }));

app.use(async (req, res, next) => {
  try {
    if (req.session.userId) {
      const user = await User.findById(req.session.userId);

      if (user) {
        req.session.username = user.Username;
        res.locals.currentUser = user
          ? { _id: req.session.userId, username: req.session.username }
          : null;
      } else {
        res.locals.currentUser = null;
      }
    } else {
      res.locals.currentUser = null;
    }
    next();
  } catch (err) {
    console.error("Error in middleware:", err);
    next(err);
  }
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "Views"));
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Mongo connected successfully"))
  .catch((err) => console.log("❌ Failed to connect to Mongo", err));

function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  res.redirect("/login");
}

app.get("/posts/new", isAuthenticated, async (req, res) => {
  try {
    res.render("Blogs/newForm");
  } catch (err) {
    res.status(500).json({ err: "Failed to fetch blogs" });
  }
});

app.post(
  "/posts",
  isAuthenticated,
  upload.single("image"),
  async (req, res) => {
    try {
      const { title, body, author, Author } = req.body;

      let imageUrl = null;

      if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "blogs",
        });
        imageUrl = result.secure_url;

        fs.unlinkSync(req.file.path);
      }

      const newBlog = new blog({
        title,
        body,
        Author,
        author: req.session.userId,
        imageUrl,
      });

      await newBlog.save();

      res.render("Blogs/newBlogs", { blogs: [newBlog] });
    } catch (error) {
      console.error(error);
      res.status(500).json({ err: "Failed to post blog. Please try again" });
    }
  }
);

app.get("/", (req, res) => {
  res.redirect("/posts");
});

app.get("/posts", async (req, res) => {
  try {
    const limit = 9;
    const page = parseInt(req.query.page) || 1;

    const allBlogs = await blog.countDocuments();
    const allPages = Math.ceil(allBlogs / limit);

    const blogs = await blog
      .find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.render("Blogs/allBlogs", {
      blogs,
      currentPage: page,
      totalPages: allPages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ err: "Failed to fetch blogs" });
  }
});

app.get("/about", (req, res) => {
  res.render("Blog/About");
});

app.get("/posts/:id/edit", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const singleBlog = await blog.findById(id);

    if (singleBlog.author.toString() !== req.session.userId) {
      return res.status(403).send(`
        <script>
          alert("Not authorized to edit this blog");
          window.location.href = "/posts";
        </script>
      `);
    }

    res.render("Blogs/Editedblog", { blogs: singleBlog });
  } catch (error) {
    res.status(500).json({ err: "Failed to fetch blog for editing" });
  }
});

app.put("/posts/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const blogPost = await blog.findById(id);

    if (!blogPost) {
      return res.status(404).send("Blog not found");
    }

    if (blogPost.author.toString() !== req.session.userId) {
      return res.status(403).send("Not authorized to update this blog");
    }

    await blog.findByIdAndUpdate(id, req.body, { new: true });
    res.redirect("/posts");
  } catch (error) {
    res.status(500).json({ error: "Failed to update blog" });
  }
});

app.delete("/posts/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const delBlogs = await blog.findById(id);

    if (delBlogs.author.toString() !== req.session.userId) {
      return res.status(403).send(`<script>
          alert("Only blog users can delete their blogs");
          window.location.href = "/posts";
        </script>`);
    }

    await blog.findByIdAndDelete(req.params.id);
    res.redirect("/posts");
  } catch (error) {
    res.status(500).json({ error: "Failed to delete blog" });
  }
});

app.get("/signup", (req, res) => {
  res.render("Auth/Register");
});

app.post("/signup", async (req, res) => {
  try {
    const { Username, email, password } = req.body;
    const newUser = new User(req.body);
    await newUser.save();
    req.session.userId = newUser._id;
    req.session.save((err) => {
      if (err) return res.status(500).send(" Could not save session");
      res.redirect("/posts");
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to register user" });
  }
});

app.post("/upload", upload.single("Upload"), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "my_blog_images",
    });
    res.json({ imageUrl: result.secure_url });
  } catch (err) {
    res.status(500).json({ error: "Image upload failed", details: err });
  }
});

app.get("/login", (req, res) => {
  res.render("Auth/Login");
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

app.post("/search", async (req, res) => {
  try {
    const { query } = req.body;

    const blogs = await blog.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { body: { $regex: query, $options: "i" } },
      ],
    });

    res.render("search", { blogs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ err: "Failed to search blogs" });
  }
});
app.post("/view", async (req, res) => {
  try {
    const { id } = req.body;
    const singleBlog = await blog.findById(id);

    if (!singleBlog) {
      return res.status(404).send("Blog not found");
    }

    res.render("view", { blog: singleBlog });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}/posts`);
});
