const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      index: true,
      unique: true,
      default: Date.now,
    },
    name: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    images: {
      type: Array,
      default: [
        {
          url: "https://via.placeholder.com/200x200.png?text=Profile",
          public_Id: Date.now,
        },
      ],
    },
    about: {
      type: String,
    },
    age: {
      type: Number,
    },
    gender: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
