const blog = require("../Models/Schema");
const mongoose = require("mongoose");

const LoadBlogs = async () => {
  const blogs = await blog.find();
  return blogs;
};

const deleteBlog = async (id) => {
  try {
    await blog.findByIdAndDelete(id);
    console.log("Blog deleted successfully");
    return LoadBlogs();
  } catch (err) {
    console.error("Error deleting blog:", err.message);
  }
};

const updateBlog = async (id, updatedData) => {
  try {
    await blog.findByIdAndUpdate(id, updatedData, { new: true });
    console.log("Blog updated successfully");
    return LoadBlogs();
  } catch (err) {
    console.error("Error updating blog:", err.message);
  }
};

module.exports = { LoadBlogs, deleteBlog, updateBlog };
