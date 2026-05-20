const express = require("express");
const cors = require("cors");
const path = require("path");

const userRoutes =
  require("./routes/userRoutes");

const authRoutes =
  require("./routes/authRoutes");

const transaksiRoutes =
  require("./routes/transaksiRoutes");

const rewardRoutes =
  require("./routes/rewardRoutes");

const app = express();

// MIDDLEWARE
app.use(cors());

app.use(express.json());

// STATIC FILES (UPLOADS)
app.use(
  "/uploads",
  express.static(
    path.resolve("uploads")
  )
);

// ROUTES
app.use(
  "/api/users",
  userRoutes
);

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/transaksi",
  transaksiRoutes
);

app.use(
  "/api/rewards",
  rewardRoutes
);

// TEST ROUTE
app.get("/", (req, res) => {

  res.send(
    "Backend Sortirin Running"
  );
});

module.exports = app;