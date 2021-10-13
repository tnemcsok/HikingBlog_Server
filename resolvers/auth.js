const shortid = require("shortid");
const { authCheck } = require("../helpers/authCheck");
const User = require("../models/user");
const Hike = require("../models/hike");

const profile = async (parent, args, { req }) => {
  const currentUser = await authCheck(req);
  return await User.findOne({ email: currentUser.email }).exec();
};

const publicProfile = async (parent, args, { req }) => {
  return await User.findOne({ username: args.username }).exec();
};

const allUsers = async (parent, args) => await User.find({}).exec();

const userCreate = async (parent, args, { req }) => {
  const currentUser = await authCheck(req);
  const user = await User.findOne({ email: currentUser.email });

  return user
    ? user
    : new User({
        email: currentUser.email,
        username: shortid.generate(),
      }).save();
};

const userUpdate = async (parent, args, { req }) => {
  const currentUser = await authCheck(req);
  console.log(args);
  const updatedUser = await User.findOneAndUpdate(
    { email: currentUser.email },
    { ...args.input },
    { new: true }
  ).exec();
  return updatedUser;
};

const userDelete = async (parent, args, { req }) => {
  // Check the user
  const currentUser = await authCheck(req);

  // Get the user
  const currentUserFromDb = await User.findOne({
    email: currentUser.email,
  }).exec();

  // Delete the hikes of the user

  await Hike.deleteMany({ postedBy: { _id: currentUserFromDb._id } });

  // Delete the user
  let deletedUser = await User.findByIdAndDelete({
    _id: currentUserFromDb._id,
  }).exec();

  return deletedUser;
};

module.exports = {
  Query: {
    profile,
    publicProfile,
    allUsers,
  },
  Mutation: {
    userCreate,
    userUpdate,
    userDelete,
  },
};
