import * as express from "express";
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const router = express.Router();
const userModel = require("../models/user");
const verificationModel = require("../models/userVerification");

//email handeler
import nodemailer from "nodemailer";
//Password handler
import bcrypt from "bcrypt";

require("dotenv").config();

//nodemailer stuff
let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

router.post("/createAccount", async (req: Request, res: Response) => {
  let { name, username, email, password } = req.body;
  name = name.trim();
  username = username.trim();
  email = email.trim();
  password = password.trim();

  if (name === "" || username === "" || email === "" || password === "") {
    res.json({
      status: "FAILED",
      message: "Empty inputField",
    });
  } else if (!/^[a-zA-Z0-9]*$/.test(name)) {
    res.json({
      status: "FAILED",
      message: "Name is not valid",
    });
  } else if (!/^[a-zA-Z]+$/.test(name)) {
    res.json({
      status: "FAILED",
      message: "Username is not valid",
    });
  } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
    res.json({
      status: "FAILED",
      message: "Email is not valid",
    });
  } else if (password.length < 8) {
    res.json({
      status: "FAILED",
      message: "Password is too short",
    });
  } else {
    try {
      //check if username exists
      const userNameExists: boolean = await userModel.findUsername(username);
      if (userNameExists) {
        throw new Error(`User ${username} already exists`);
      } else {
        //check if email exists
        const emailExists: boolean = await userModel.findEmail(email);

        if (!emailExists) {
          throw new Error(`Email ${email} already exists`);
        } else {
          //password handling
          const saltRound = 10;
          const hashedPassword: string = await bcrypt.hash(password, saltRound);

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
              throw new Error("An error occurred while creating the user.");
            } else {
              sendVerificationEmail(user, res);
            }
          }
        }
      }
    } catch (err: any) {
      res.json({
        status: "FAILED",
        message: err.message,
      });
    }
  }
});

//send verification email
const sendVerificationEmail = ({ id, email }: any, res: Response) => {
  var randomNumber = Math.floor(Math.random() * 90000) + 10000;

  const mailOptions = {
    from: process.env.MAIL_USER,
    to: email,
    subject: "Verify your Email",
    html: `<p>Please use the following code to verify your email:</p>
    <p>This code <b>expires in 5 minutes... Time is ticking :)</b></p>
    <p>${randomNumber}</p>`,
  };

  // set values in userVerification collection
  verificationModel
    .createUserVerification({
      userId: id,
      verificationCode: randomNumber,
    })
    .then(() => {
      transporter
        .sendMail(mailOptions)
        .then(() => {
          //email has been sent and record saved
          res.json({
            status: "PENDING",
            message: "Verifcation email is pending",
          });
        })
        .catch((err: any) => {
          console.log(err);
          res.json({
            status: "FAILED",
            message: "Verification email failed to send",
          });
        });
    })
    .catch((error: any) => {
      console.log(error);
      res.json({
        status: "FAILED",
        message: "Couldn't save verification email data",
      });
    });
};

router.post("/verifyEmail", async (req: Request, res: Response) => {
  try {
    const userID: number = req.body.userID;
    const verificationCode: number = req.body.verificationCode;
    //check for valid inputs
    if (!userID || !verificationCode) {
      throw Error("Empty credentials");
    } else {
      //check if the verifcation code is valid
      const verificationInfo: any = await verificationModel.getVerificationInfo(
        userID
      );

      const storedCode: number = verificationInfo.verificationcode;
      const expiresAt = new Date(verificationInfo.expiresat);
      if (!storedCode || !expiresAt) {
        throw new Error("Had trouble getting storedCode or expiredAt");
      }
      var now = new Date();
      if (expiresAt < now) {
        //delete verifcation code since it is expired
        await verificationModel.deleteVerification(userID);
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
            await userModel.updateVerification(userID);
            //remove verification code from database
            await verificationModel.deleteVerification(userID);
            res.json({
              status: "SUCCESS",
              message: "Successfully Verified User",
            });
          }
        }
      }
    }
  } catch (err: any) {
    res.json({
      status: "FAILED",
      message: err.message,
    });
  }
});

router.post("/login", (req: Request, res: Response) => {
  let { email, password } = req.body;
  email = email.trim();
  password = password.trim();
  if (email == "" || password == "") {
    res.json({
      status: "FAILED",
      message: "Please do not leave any fields empty",
    });
  } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
    res.json({
      status: "FAILED",
      message: "Email is not valid",
    });
  } else {
    //check if email exists
    userModel
      .findEmail(email)
      .then((result: any) => {
        if (result) {
          res.json({
            status: "FAILED",
            message: "User with this email does not exist",
          });
        } else {
          //get hashedpassword of account
          userModel
            .getPassword(email)
            .then((hashedPassword: string) => {
              bcrypt
                .compare(password, hashedPassword)
                .then((result: any) => {
                  if (result) {
                    res.json({
                      status: "SUCCESS",
                      message: "Sign in successfully",
                    });
                  } else {
                    res.json({
                      status: "FAILED",
                      message: "Invalid password",
                    });
                  }
                })
                .catch((err: any) => {
                  res.json({
                    status: "FAILED",
                    message: "An Error occurred while validating credentials",
                  });
                });
            })
            .catch((err: any) => {
              res.json({
                status: "FAILED",
                message: "An Error occurred while trying to get password",
              });
            });
        }
      })
      .catch((error: any) => {
        res.json({
          status: "FAILED",
          message: "Email does not exist",
        });
      });
  }
});

module.exports = router;
