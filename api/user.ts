const userModel = require("../models/user");
const verificationModel = require("../models/userVerification");
const tokenModel = require("../models/token");
import * as trpc from "@trpc/server";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { decodeAndVerifyRefreshToken } from "../utils/verifyJwt";
import { Context } from "../context";
import { User } from "../utils/verifyJwt";

const prisma = new PrismaClient();

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
      name: z.string(),
      username: z.string(),
      email: z.string(),
      password: z.string(),
    }),
    async resolve(req) {
      let { name, username, email, password } = req.input;
      name = name.trim();
      username = username.trim();
      email = email.trim();
      password = password.trim();

      if (name === "" || username === "" || email === "" || password === "") {
        return {
          status: "FAILED",
          message: "Empty inputField",
        };
      } else if (!/^[a-zA-Z0-9]*$/.test(name)) {
        return {
          status: "FAILED",
          message: "Name is not valid",
        };
      } else if (!/^[a-zA-Z]+$/.test(name)) {
        return {
          status: "FAILED",
          message: "Username is not valid",
        };
      } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
        return {
          status: "FAILED",
          message: "Email is not valid",
        };
      } else if (password.length < 8) {
        return {
          status: "FAILED",
          message: "Password is too short",
        };
      } else {
        try {
          //check if username exists
          const userNameExists: number = await userModel.usernameExists(
            username,
            prisma
          );
          if (userNameExists > 0) {
            throw new Error(`User ${username} already exists`);
          } else {
            //check if email exists
            const emailExists: number = await userModel.emailExists(
              email,
              prisma
            );
            if (emailExists > 0) {
              throw new Error(`Email ${email} already exists`);
            } else {
              //password handling
              const saltRound = 10;
              const hashedPassword: string = await bcrypt.hash(
                password,
                saltRound
              );

              if (!hashedPassword) {
                throw new Error("Password hashing failed");
              } else {
                const user = await userModel.createUser(
                  {
                    name,
                    username,
                    email,
                    password: hashedPassword,
                  },
                  prisma
                );
                if (!user) {
                  throw new Error("An error occurred while creating the user.");
                } else {
                  return sendVerificationEmail(user);
                }
              }
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
  .mutation("verifyEmail", {
    input: z.object({
      userID: z.number(),
      verificationCode: z.number(),
    }),
    async resolve(req) {
      try {
        const userID: number = req.input.userID;
        const verificationCode: number = req.input.verificationCode;
        //check for valid inputs
        if (!userID || !verificationCode) {
          throw Error("Empty credentials");
        } else {
          //check if the verifcation code is valid
          const verificationInfo: any =
            await verificationModel.getVerificationInfo(userID, prisma);

          const storedCode: number = verificationInfo.verificationcode;
          const expiresAt = new Date(verificationInfo.expiresat);
          if (!storedCode || !expiresAt) {
            throw new Error("Had trouble getting storedCode or expiredAt");
          }
          var now = new Date();
          if (expiresAt < now) {
            //delete verifcation code since it is expired
            await verificationModel.deleteVerification(userID, prisma);
            throw new Error("Code Expired");
          } else {
            if (!storedCode) {
              throw new Error("Null verification code");
            } else {
              //check if the verifcation code is valid
              if (storedCode !== verificationCode) {
                throw new Error("Verification code is invalid");
              } else {
                //verify the user
                await userModel.updateVerification(userID, prisma);

                //remove verification code from database
                await verificationModel.deleteVerification(userID, prisma);
                return {
                  status: "SUCCESS",
                  message: "Successfully Verified User",
                };
              }
            }
          }
        }
      } catch (err: any) {
        return {
          status: "FAILED",
          message: err.message,
        };
      }
    },
  })
  .mutation("login", {
    input: z.object({
      email: z.string(),
      password: z.string(),
    }),
    async resolve(req) {
      let { email, password } = req.input;
      email = email.trim();
      password = password.trim();
      if (email == "" || password == "") {
        return {
          status: "FAILED",
          message: "Please do not leave any fields empty",
        };
      } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
        return {
          status: "FAILED",
          message: "Email is not valid",
        };
      } else {
        try {
          //check if email exists
          const emailExists: number = await userModel.emailExists(
            email,
            prisma
          );

          if (emailExists == 0) {
            throw new Error("Email does not exist");
          } else {
            const userData = await userModel.getIDPasswordFromEmail(
              email,
              prisma
            );
            const hashedPassword = userData.password;
            const userID = userData.id;
            if (!hashedPassword) {
              throw new Error(
                "An error occurred while trying to retrieve password"
              );
            } else {
              const correctPassword: boolean = await bcrypt.compare(
                password,
                hashedPassword
              );
              if (!correctPassword) {
                throw new Error("Password is incorrect");
              } else {
                const user: User = { email: email };
                const accessToken = jwt.sign(
                  user,
                  process.env.ACCESS_TOKEN_SECRET!,
                  { expiresIn: "30m" }
                );
                const refreshToken = jwt.sign(
                  user,
                  process.env.REFRESH_TOKEN_SECRET!
                );
                const tokenData = await tokenModel.addNewRefreshToken(
                  refreshToken,
                  userID,
                  prisma
                );
                if (!tokenData) {
                  throw new Error("Refresh token failed to be created");
                } else {
                  return {
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                    status: "SUCCESS",
                    message: "Sign in successfully",
                  };
                }
              }
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
  //returns a jwt access token using the refresh token
  .mutation("refresh", {
    input: z.object({
      token: z.string(),
    }),
    async resolve(req) {
      try {
        if (!req.input) {
          throw new Error("Invalid request");
        }
        //check if refreshToken is valid
        const tokenCount: number = tokenModel.refreshTokenExists(
          req.input,
          prisma
        );
        if (tokenCount == 0) {
          throw new Error("Refresh token does not exist");
        } else {
          //verifies refreshToken
          const user = await decodeAndVerifyRefreshToken(req.input.token);
          //creates new access token
          const accessToken = jwt.sign(
            { email: user.email },
            process.env.ACCESS_TOKEN_SECRET!,
            {
              expiresIn: "15m",
            }
          );
          return {
            accessToken: accessToken,
          };
        }
      } catch (err: any) {
        return {
          status: "FAILED",
          message: err.message,
        };
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

//send verification email
const sendVerificationEmail = async ({ id, email }: any) => {
  var randomNumber = Math.floor(Math.random() * 90000) + 10000;

  const mailOptions = {
    from: process.env.MAIL_USER,
    to: email,
    subject: "Verify your Email",
    html: `<p>Please use the following code to verify your email:</p>
    <p>This code <b>expires in 5 minutes... Time is ticking :)</b></p>
    <p>${randomNumber}</p>`,
  };
  try {
    // set values in userVerification collection
    const ver = await verificationModel.createUserVerification(
      {
        userId: id,
        verificationCode: randomNumber,
      },
      prisma
    );
    if (!ver) {
      throw new Error("User Verifcation Creation Failed");
    } else {
      await transporter.sendMail(mailOptions);
      return {
        status: "PENDING",
        message: "Verifcation email is pending",
      };
    }
  } catch (err: any) {
    return {
      status: "FAILED",
      message: err.message,
    };
  }
};

export type userRouter = typeof userRouter;
