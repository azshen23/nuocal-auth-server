const express = require("express");
const router = express.Router();
const userModel = require("../models/user");
const verificationModel = require("../models/userVerification");

//email handeler
const nodemailer = require("nodemailer");
//Password handler
const bcrypt = require("bcrypt");
//unique string
const { v4: uuidv4 } = require("uuid");

require("dotenv").config();

//path for static verified page
const path = require("path");

//nodemailer stuff
let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

//testing success
transporter.verify((error, success) => {
  if (error) {
    console.log(error);
  } else {
    console.log(success);
  }
});

router.post("/createAccount", (req, res) => {
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
    //check if username exists
    userModel
      .findUsername(username)
      .then((result) => {
        if (result) {
          res.json({
            status: "FAILED",
            message: "Username already exists",
          });
        } else {
          //check if email exists
          userModel.findEmail(email).then((result) => {
            if (result) {
              //password handling
              const saltRound = 10;
              bcrypt
                .hash(password, saltRound)
                .then((hashedPassword) => {
                  userModel
                    .createUser({
                      name,
                      username,
                      email,
                      password: hashedPassword,
                    })
                    .then((result) => {
                      sendVerificationEmail(result, res);
                    })
                    .catch((err) => {
                      res.json({
                        status: "FAILED",
                        message: "An error occurred while creating the user.",
                      });
                    });
                })
                .catch((err) => {
                  res.json({
                    status: "FAILED",
                    message: "An error occurred while hashing the password",
                  });
                });
            } else {
              res.json({
                status: "FAILED",
                message: "An account already exists with this email address",
              });
            }
          });
        }
      })
      .catch((err) => {
        res.json({
          status: "FAILED",
          message: "An Error occurred while checking for existing username",
        });
      });
  }
});

//send verification email
const sendVerificationEmail = ({ id, email }, res) => {
  const currentUrl = "https://nuocal.up.railway.app/";

  const uniqueString = uuidv4() + id;

  const mailOptions = {
    from: process.env.MAIL_USER,
    to: email,
    subject: "Verify your Email",
    html: `<p>Please click on the following link to verify your email address:</p>
    <p>This link <b>expires in 6 hours</b></p><p><a href=${
      currentUrl + "user/verify/" + id + "/" + uniqueString
    }>Link</a></p></p>`,
  };

  // hash the uniqueString

  const saltRounds = 10;
  bcrypt
    .hash(uniqueString, saltRounds)
    .then((hashedUniqueString) => {
      // set values in userVerification collection
      verificationModel
        .createUserVerification({
          userId: id,
          uniqueString: hashedUniqueString,
          createdAt: Date.now(),
          expiresAt: Date.now() + 21600000,
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
            .catch((err) => {
              console.log(err);
              res.json({
                status: "FAILED",
                message: "Verification email failed",
              });
            });
        })
        .catch((error) => {
          console.log(error);
          res.json({
            status: "FAILED",
            message: "Couldn't save verification email data",
          });
        });
    })
    .catch((error) => {
      console.log(error);
      res.json({
        status: "FAILED",
        message: "An error occurred while hashing email data",
      });
    });
};

//verify email
router.get("/verify/:userId/:uniqueString", (req, res) => {
  let { userId, uniqueString } = req.params;

  verificationModel
    .findUserVerification(userId)
    .then((result) => {
      if (result) {
        //found
        verificationModel.getVerificationInfo(userId).then((result) => {
          const expiresAt = result.expiresAt;
          const hashedUniqueString = result.uniquestring;
          //expired verification email
          if (expiresAt < Date.now()) {
            //delete recrod.
            verificationModel
              .deleteVerification(userId)
              .then(() => {
                userModel
                  .deleteUser(userId)
                  .then(() => {
                    let message = "Link has expired, please sign up again";
                    res.redirect(
                      `/user/verified/error=true&message=${message}`
                    );
                  })
                  .catch((error) => {
                    let message = "An error occurred while deleting user";
                    res.redirect(
                      `/user/verified/error=true&message=${message}`
                    );
                  });
              })
              .catch((error) => {
                console.log(error);
                let message =
                  "An error occurred while checking for existing verification email";
                res.redirect(`/user/verified/error=true&message=${message}`);
              });
          } else {
            //valid verification email timeframe
            console.log(uniqueString, hashedUniqueString);
            bcrypt
              .compare(uniqueString, hashedUniqueString)
              .then((result) => {
                if (result) {
                  //strings match
                  userModel
                    .updateVerification(userId)
                    .then(() => {
                      //delete verifciation email record
                      verificationModel
                        .deleteVerification(userId)
                        .then(() => {
                          res.sendFile(
                            path.join(__dirname, "../views/verified.html")
                          );
                        })
                        .catch((error) => {
                          console.log(error);
                          let message =
                            "An error occurred while updating user record to show verification status";
                          res.redirect(
                            `/user/verified/error=true&message=${message}`
                          );
                        });
                    })
                    .catch((error) => {
                      console.log(error);
                      let message =
                        "An error occurred while deleting verification record";
                      res.redirect(
                        `/user/verified/error=true&message=${message}`
                      );
                    });
                } else {
                  let message = "Invalid verifcation details";
                  res.redirect(`/user/verified/error=true&message=${message}`);
                }
              })
              .catch((error) => {
                console.log(error);
                let message =
                  "An error occurred while comparing for unique strings";
                res.redirect(`/user/verified/error=true&message=${message}`);
              });
          }
        });
      } else {
        //not found
        let message =
          "An error occurred while checking for existing verification email";
        res.redirect(`/user/verified/error=true&message=${message}`);
      }
    })
    .catch((error) => {
      console.log(error);
      let message =
        "An error occurred while checking for existing verification email";
      res.redirect(`/user/verified/error=true&message=${message}`);
    });
});

//verified page route
router.get("/verified", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/verifified.html"));
});

router.post("/login", (req, res) => {
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
      .then((result) => {
        if (result) {
          res.json({
            status: "FAILED",
            message: "User with this email does not exist",
          });
        } else {
          //get hashedpassword of account
          userModel
            .getPassword(email)
            .then((hashedPassword) => {
              bcrypt
                .compare(password, hashedPassword)
                .then((result) => {
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
                .catch((err) => {
                  res.json({
                    status: "FAILED",
                    message: "An Error occurred while validating credentials",
                  });
                });
            })
            .catch((err) => {
              res.json({
                status: "FAILED",
                message: "An Error occurred while trying to get password",
              });
            });
        }
      })
      .catch((error) => {
        res.json({
          status: "FAILED",
          message: "Email does not exist",
        });
      });
  }
});

module.exports = router;
