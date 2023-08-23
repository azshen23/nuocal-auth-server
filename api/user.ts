import userModel from "../models/user";
import * as trpc from "@trpc/server";
import { z } from "zod";
import { Context } from "../context";

//email handeler
import nodemailer from "nodemailer";
//Password handler
import bcrypt from "bcrypt";
import { TRPCError } from "@trpc/server";
require("dotenv").config();

//nodemailer stuff
let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

export const userRouter = trpc
  .router<Context>()
  .mutation("createAccount", {
    input: z.object({
      username: z
        .string()
        .min(3, { message: "Must be 3 or more characters long" }),
      email: z.string().email().min(1),
    }),
    async resolve(req) {
      let { username, email } = req.input;
      username = username.trim();
      email = email.trim();

      if (!/^[a-zA-Z0-9]+$/.test(username)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid characters in username",
        });
      } else {
        try {
          //check if username exists
          const userNameExists: number = await userModel.usernameExists(
            username
          );
          if (userNameExists > 0) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Username already exists",
            });
          } else {
            //check if email exists
            const emailExists: number = await userModel.emailExists(email);
            if (emailExists > 0) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Email already exists",
              });
            } else {
              //password handling
              const saltRound = 10;
            }
          }
        } catch (err: any) {
          return {
            status: "FAILED",
            message: err.message,
          };
        }
      }
    },
  })
  .query("getUser", {
    async resolve({ ctx }) {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return "hello";
    },
  });

export type userRouter = typeof userRouter;
