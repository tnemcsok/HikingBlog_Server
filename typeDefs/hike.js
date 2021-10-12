const { gql } = require("apollo-server-express");

module.exports = gql`
  type Hike {
    _id: ID!
    title: String!
    summary: String!
    content: String
    country: String
    region: String
    coverImage: Image
    images: [Image]
    difficulty: String
    distance: Int
    elevation: Int
    duration: Int
    postedBy: User
  }
  # input type
  input HikeCreateInput {
    title: String!
    summary: String!
    content: String
    country: String
    region: String
    coverImage: ImageInput
    images: [ImageInput]
    difficulty: String
    distance: Int
    elevation: Int
    duration: Int
  }
  # input type
  input HikeUpdateInput {
    _id: String!
    title: String!
    summary: String!
    content: String
    country: String
    region: String
    coverImage: ImageInput
    images: [ImageInput]
    difficulty: String
    distance: Int
    elevation: Int
    duration: Int
  }
  # queries
  type Query {
    totalHikes: Int!
    allHikes(page: Int): [Hike!]!
    hikesByUser: [Hike!]!
    hikesByOtherUser(username: String!): [Hike!]!
    singleHike(hikeId: String!): Hike!
    search(query: String): [Hike]
  }
  # mutations
  type Mutation {
    hikeCreate(input: HikeCreateInput!): Hike!
    hikeUpdate(input: HikeUpdateInput!): Hike!
    hikeDelete(hikeId: String!): Hike!
  }
  # subscriptions
  type Subscription {
    hikeAdded: Hike
    hikeUpdated: Hike
    hikeDeleted: Hike
  }
`;
