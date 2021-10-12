const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const hikeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: "Title is required",
      text: true,
    },
    summary: {
      type: String,
      required: "Content is required",
      text: true,
    },
    content: {
      type: String,
      text: true,
    },
    country: {
      type: String,
      text: true,
      default: "N/A",
    },
    region: {
      type: String,
      text: true,
      default: "N/A",
    },
    coverImage: {
      url: {
        type: String,
        default: "https://via.placeholder.com/200x200.png?text=Post",
      },
      public_id: {
        type: String,
        default: Date.now,
      },
    },
    images: {
      type: Array,
      default: [
        {
          url: "https://via.placeholder.com/200x200.png?text=Post",
          public_Id: Date.now,
        },
      ],
    },
    difficulty: {
      type: String,
      text: true,
    },
    distance: {
      type: Number,
    },
    elevation: {
      type: Number,
    },
    duration: {
      type: Number,
    },
    postedBy: {
      type: ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Hike", hikeSchema);
