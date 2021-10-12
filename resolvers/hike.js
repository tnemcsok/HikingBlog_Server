const { authCheck } = require("../helpers/authCheck");
const Hike = require("../models/hike");
const User = require("../models/user");
const { PubSub } = require("graphql-subscriptions");

const pubsub = new PubSub();

// Subscriptions

const HIKE_ADDED = "HIKE_ADDED";
const HIKE_UPDATED = "HIKE_UPDATED";
const HIKE_DELETED = "HIKE_DELETED";

// Queries

const allHikes = async (parent, args) => {
  const currentPage = args.page || 1;
  const perPage = 3;

  return await Hike.find({})
    .skip((currentPage - 1) * perPage)
    .populate("postedBy", "username _id")
    .limit(perPage)
    .sort({ createdAt: -1 })
    .exec();
};

const totalHikes = async (parent, args) =>
  await Hike.find({}).estimatedDocumentCount().exec();

const hikesByUser = async (parent, args, { req }) => {
  const currentUser = await authCheck(req);
  const currentUserFromDb = await User.findOne({
    email: currentUser.email,
  }).exec();

  return await Hike.find({ postedBy: currentUserFromDb })
    .populate("postedBy", "_id username")
    .sort({ createdAt: -1 });
};

const hikesByOtherUser = async (parent, args, { req }) => {
  const searchedUserFromDb = await User.findOne({
    username: args.username,
  }).exec();

  console.log("User", searchedUserFromDb);

  return await Hike.find({ postedBy: searchedUserFromDb })
    .populate("postedBy", "_id username")
    .sort({ createdAt: -1 });
};

const singleHike = async (parent, args) => {
  return await Hike.findById({ _id: args.hikeId })
    .populate("postedBy", "_id username")
    .exec();
};

const search = async (parent, { query }) => {
  return await Hike.find({ $text: { $search: query } })
    .populate("postedBy", "username")
    .exec();
};

// Mutations

const hikeCreate = async (parent, args, { req }) => {
  // Check the user
  const currentUser = await authCheck(req);

  // Validation
  if (args.input.summary.trim() === "") throw new Error("Summary is required");

  // Get the user
  const currentUserFromDb = await User.findOne({
    email: currentUser.email,
  });

  // Create new hikeand save to database
  let newHike = await new Hike({
    ...args.input,
    postedBy: currentUserFromDb._id,
  })
    .save()
    .then((hike) =>
      hike.populate("postedBy", "_id username email").execPopulate()
    );

  pubsub.publish(HIKE_ADDED, { hikeAdded: newHike });

  return newHike;
};

const hikeUpdate = async (parent, args, { req }) => {
  // Check the user
  const currentUser = await authCheck(req);

  // Validation
  if (args.input.summary.trim() === "") throw new Error("Summary is requried");

  //  Get current user
  const currentUserFromDb = await User.findOne({
    email: currentUser.email,
  }).exec();

  // Get hike to update
  const hikeToUpdate = await Hike.findById({ _id: args.input._id }).exec();

  // If currentuser id and id of the hike's postedBy user id is same, allow update
  if (currentUserFromDb._id.toString() !== hikeToUpdate.postedBy._id.toString())
    throw new Error("Unauthorized action");

  // Update the hike
  let updatedHike = await Hike.findByIdAndUpdate(
    args.input._id,
    { ...args.input },
    { new: true }
  )
    .exec()
    .then((hike) => hike.populate("postedBy", "_id username").execPopulate());

  pubsub.publish(HIKE_UPDATED, {
    hikeUpdated: updatedHike,
  });

  return updatedHike;
};

const hikeDelete = async (parent, args, { req }) => {
  // Check the user
  const currentUser = await authCheck(req);

  // Get the user
  const currentUserFromDb = await User.findOne({
    email: currentUser.email,
  }).exec();

  // Get the hike
  const hikeToDelete = await Hike.findById({ _id: args.hikeId }).exec();
  if (currentUserFromDb._id.toString() !== hikeToDelete.postedBy._id.toString())
    throw new Error("Unauthorized action");

  // Delete the hike
  let deletedHike = await Hike.findByIdAndDelete({ _id: args.hikeId })
    .exec()
    .then((hike) => hike.populate("postedBy", "_id username").execPopulate());

  pubsub.publish(HIKE_DELETED, {
    hikeDeleted: deletedHike,
  });

  return deletedHike;
};

module.exports = {
  Query: {
    allHikes,
    hikesByUser,
    hikesByOtherUser,
    singleHike,
    totalHikes,
    search,
  },

  Mutation: {
    hikeCreate,
    hikeUpdate,
    hikeDelete,
  },

  Subscription: {
    hikeAdded: {
      subscribe: () => pubsub.asyncIterator([HIKE_ADDED]),
    },
    hikeUpdated: {
      subscribe: () => pubsub.asyncIterator([HIKE_UPDATED]),
    },
    hikeDeleted: {
      subscribe: () => pubsub.asyncIterator([HIKE_DELETED]),
    },
  },
};
