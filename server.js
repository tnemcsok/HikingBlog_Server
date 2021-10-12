const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const http = require("http");
const path = require("path");
const mongoose = require("mongoose");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const { mergeTypeDefs, mergeResolvers } = require("@graphql-tools/merge");
const { loadFilesSync } = require("@graphql-tools/load-files");
require("dotenv").config();
const cors = require("cors");
const bodyParser = require("body-parser");
const cloudinary = require("cloudinary");
const { authCheckMiddleware } = require("./helpers/authCheck");
const { SubscriptionServer } = require("subscriptions-transport-ws");
const { execute, subscribe } = require("graphql");

// express server
const app = express();

// db
const db = async () => {
  try {
    const success = await mongoose.connect(process.env.DATABASE_CLOUD, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    });
    console.log("DB Connected");
  } catch (error) {
    console.log("DB Connection Error", error);
  }
};
// execute database connection
db();

//Middlewares
app.use(cors());
app.use(bodyParser.json({ limit: "5mb" }));

const typeDefs = mergeTypeDefs(
  loadFilesSync(path.join(__dirname, "./typeDefs"))
);

const resolvers = mergeResolvers(
  loadFilesSync(path.join(__dirname, "./resolvers"))
);

const schema = makeExecutableSchema({ typeDefs, resolvers });

async function startServer() {
  apolloServer = new ApolloServer({
    schema,
    plugins: [
      {
        async serverWillStart() {
          return {
            async drainServer() {
              subscriptionServer.close();
            },
          };
        },
      },
    ],
    context: ({ req }) => ({ req }),
  });
  await apolloServer.start();
  apolloServer.applyMiddleware({ app });
}

startServer();

//server

const httpserver = http.createServer(app);

const subscriptionServer = SubscriptionServer.create(
  {
    // This is the `schema` we just created.
    schema,
    // These are imported from `graphql`.
    execute,
    subscribe,
  },
  {
    // This is the `httpServer` we created in a previous step.
    server: httpserver,
    // This `server` is the instance returned from `new ApolloServer`.
    path: apolloServer.graphqlPath,
  }
);

// cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// upload
app.post("/uploadimages", authCheckMiddleware, (req, res) => {
  cloudinary.uploader.upload(
    req.body.image,
    (result) => {
      console.log("result", result);

      res.send({
        public_id: result.public_id,
        url: result.secure_url,
      });
    },
    {
      public_id: `${Date.now()}`, // public name
      resource_type: "auto", // JPEG, PNG
    }
  );
});

// remove image
app.post("/removeimage", authCheckMiddleware, (req, res) => {
  let image_id = req.body.public_id;

  cloudinary.uploader.destroy(image_id, (error, result) => {
    if (error) return res.json({ success: false, error });
    res.send("ok");
  });
});

// port
httpserver.listen(process.env.PORT, function () {
  console.log(`server is ready at http://localhost:${process.env.PORT}`);
  console.log(
    `graphql-server is ready at http://localhost:${process.env.PORT}${apolloServer.graphqlPath}`
  );
});
