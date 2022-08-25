import bodyParser from "body-parser";
import express from "express";

const app = express();
const port = process.env.PORT || 3001;

const userRouter = require("./api/user");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/user", userRouter);

app.listen(port, () => {
  console.log(`App running on port ${port}.`);
});
