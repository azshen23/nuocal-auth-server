const Pool = require("pg").Pool;
const pool = new Pool();

//create a user
const createUser = async (body: any) => {
  return new Promise(function (resolve, reject) {
    const { name, username, email, password } = body;
    pool.query(
      "INSERT INTO users (name, username, email, password) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, username, email, password],
      (error: any, results: any) => {
        if (error) {
          reject(error);
        }
        resolve(results.rows[0]);
      }
    );
  });
};
//delete a user
const deleteUser = async (userId: number) => {
  return new Promise(function (resolve, reject) {
    pool.query(
      "DELETE FROM users WHERE id = $1",
      [userId],
      (error: any, results: any) => {
        if (error) {
          reject(error);
        }
        resolve(`user deleted with ID: ${userId}`);
      }
    );
  });
};

//check if username exists
const findUsername = (username: string) => {
  return new Promise(function (resolve, reject) {
    pool.query(
      "SELECT EXISTS(SELECT 1 FROM users WHERE username = $1)",
      [username],
      (error: any, result: any) => {
        if (error) {
          reject(error);
        }
        if (result.rows[0].exists == false) {
          resolve(null);
        } else {
          resolve(`user found with username: ${username}`);
        }
      }
    );
  });
};

//check if email exists
const findEmail = (email: string) => {
  return new Promise(function (resolve, reject) {
    pool.query(
      "SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)",
      [email],
      (error: any, result: any) => {
        if (error) {
          reject(error);
        }
        if (result.rows[0].exists == false) {
          resolve(`user does not exist with email: ${email}`);
        } else {
          resolve(null);
        }
      }
    );
  });
};

//get password from email
const getPassword = (email: string) => {
  return new Promise(function (resolve, reject) {
    pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
      (error: any, results: any) => {
        if (error) {
          reject(error);
        }
        resolve(results.rows[0].password);
      }
    );
  });
};

//get password from email
const getVerificationStatus = (userId: number) => {
  return new Promise(function (resolve, reject) {
    pool.query(
      "SELECT * FROM users WHERE id = $1",
      [userId],
      (error: any, results: any) => {
        if (error) {
          reject(error);
        }
        resolve(results.rows[0].verified);
      }
    );
  });
};

//update verfied attribute
const updateVerification = (userId: number) => {
  return new Promise(function (resolve, reject) {
    pool.query(
      "UPDATE users SET verified = $1 WHERE id = $2",
      [true, userId],
      (error: any, results: any) => {
        if (error) {
          reject(error);
        }
        resolve("successfully updated verifcation status");
      }
    );
  });
};

module.exports = {
  createUser,
  deleteUser,
  findUsername,
  findEmail,
  getPassword,
  getVerificationStatus,
  updateVerification,
};
