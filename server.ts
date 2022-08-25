const app = require("express")();
const port = process.env.PORT || 3001;

import * as userRouter from "./api/user";

const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/user", userRouter);

app.listen(port, () => {
  console.log(`App running on port ${port}.`);
});
