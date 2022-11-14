import userModel from "../models/user";
import verificationModel from "../models/userVerification";
import tokenModel from "../models/token";
import * as trpc from "@trpc/server";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { decodeAndVerifyRefreshToken } from "../utils/verifyJwt";
import { Context } from "../context";
import { User } from "../utils/verifyJwt";

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
  //TODO FIX VALIDATION AND SHIT
  .mutation("createAccount", {
    input: z.object({
      name: z.string().min(1),
      username: z
        .string()
        .min(3, { message: "Must be 3 or more characters long" }),
      email: z.string().email().min(1),
      password: z
        .string()
        .min(8, { message: "Must be 8 or more characters long" }),
    }),
    async resolve(req) {
      let { name, username, email, password } = req.input;
      name = name.trim();
      username = username.trim();
      email = email.trim();
      password = password.trim();

      if (!/^[a-zA-Z0-9]*$/.test(name)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid characters in name",
        });
      } else if (!/^[a-zA-Z0-9]+$/.test(username)) {
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
              const hashedPassword: string = await bcrypt.hash(
                password,
                saltRound
              );

              if (!hashedPassword) {
                throw new Error("Password hashing failed");
              } else {
                const user = await userModel.createUser({
                  name,
                  username,
                  email,
                  password: hashedPassword,
                });
                if (!user) {
                  throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to create user properly",
                  });
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
      userEmail: z.string().email(),
      verificationCode: z.number(),
    }),
    async resolve(req) {
      const userEmail: string = req.input.userEmail;
      const verificationCode: number = req.input.verificationCode;
      try {
        //check for valid inputs
        if (!userEmail || !verificationCode) {
          throw new trpc.TRPCError({
            code: "BAD_REQUEST",
            message: "Empty userId or verificationCode",
          });
        } else {
          const userID = await userModel.getIDFromEmail(userEmail);
          if (!userID) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Email not found",
            });
          }
          //check if the verifcation code is valid
          const verificationInfo: any =
            await verificationModel.getVerificationInfo(userID);

          const storedCode: number = verificationInfo.verificationcode;
          const expiresAt = new Date(verificationInfo.expiresat);
          if (!storedCode || !expiresAt) {
            throw new trpc.TRPCError({
              code: "NOT_FOUND",
              message: "Could not get stored code or expiresAt",
            });
          }
          var now = new Date();
          if (expiresAt < now) {
            //delete verifcation code since it is expired
            await verificationModel.deleteVerification(userID);
            throw new trpc.TRPCError({
              code: "NOT_FOUND",
              message: "Verification code expired, please try again",
            });
          } else {
            //check if the verifcation code is valid
            if (storedCode !== verificationCode) {
              throw new trpc.TRPCError({
                code: "BAD_REQUEST",
                message: "Invalid verification code",
              });
            } else {
              //verify the user
              await userModel.updateVerification(userID);

              //remove verification code from database
              await verificationModel.deleteVerification(userID);
              return {
                status: "SUCCESS",
                message: "Successfully Verified User",
              };
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
      email: z.string().email(),
      password: z.string().min(8),
    }),
    async resolve(req) {
      let { email, password } = req.input;
      email = email.trim();
      password = password.trim();
      try {
        //check if email exists
        const emailExists: number = await userModel.emailExists(email);
        if (emailExists == 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Email cannot be found to an existing user",
          });
        } else {
          const userData = await userModel.getIDPasswordFromEmail(email);
          if (!userData) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
          }
          const hashedPassword = userData.password;
          const userID = userData.id;
          if (!hashedPassword) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Could not retrieve password",
            });
          } else {
            const correctPassword: boolean = await bcrypt.compare(
              password,
              hashedPassword
            );
            if (!correctPassword) {
              throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "Invalid password",
              });
            } else {
              const user: User = { id: userID, email: email };
              const accessToken = jwt.sign(
                user,
                process.env.ACCESS_TOKEN_SECRET!,
                { expiresIn: "30 minutes" }
              );
              const refreshToken = jwt.sign(
                user,
                process.env.REFRESH_TOKEN_SECRET!
              );
              const tokenData = await tokenModel.addNewRefreshToken(
                refreshToken,
                userID
              );
              if (!tokenData) {
                throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: "Refresh token could not be created",
                });
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
    },
  })
  //returns a jwt access token using the refresh token
  .mutation("refresh", {
    input: z.object({
      token: z.string(),
    }),
    async resolve(req) {
      if (!req.input) {
        throw new Error("Invalid request");
      }
      //check if refreshToken is valid
      const tokenCount: number = await tokenModel.refreshTokenExists(req.input);
      if (tokenCount == 0) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Refresh token does not exist",
        });
      } else {
        //verifies refreshToken
        const user = await decodeAndVerifyRefreshToken(req.input.token);
        //creates new access token
        const accessToken = jwt.sign(
          { id: user.id, email: user.email },
          process.env.ACCESS_TOKEN_SECRET!,
          {
            expiresIn: "30m",
          }
        );
        return {
          accessToken: accessToken,
        };
      }
    },
  })
  .mutation("logout", {
    input: z.object({
      token: z.string(),
    }),
    async resolve(req) {
      try {
        if (!req.input) {
          throw new Error("Invalid request");
        }
        await tokenModel.deleteRefreshToken(req.input.token);
        return "Successfully logged out";
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
    const ver = await verificationModel.createUserVerification({
      userId: id,
      verificationCode: randomNumber,
    });
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
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: err.message,
    });
  }
};

export type userRouter = typeof userRouter;
