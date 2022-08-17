const express = require("express");

const router = express.Router();
const userModel = require("../models/user");

//Password handler
const bcrypt = require("bcrypt");

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
                      res.json({
                        status: "SUCCESS",
                        message: "Successfully created user",
                        data: result,
                      });
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
