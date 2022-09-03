import bodyParser from "body-parser";
import express from "express";
import * as trpcExpress from "@trpc/server/adapters/express";
import { createContext } from "./context";
import { userRouter } from "./api/user";
const app = express();
const port = process.env.PORT || 3001;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(
  "/user",
  trpcExpress.createExpressMiddleware({
    router: userRouter,
    createContext,
  })
);

app.listen(port, () => {
  console.log(`App running on port ${port}.`);
});
