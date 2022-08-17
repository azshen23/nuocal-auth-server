require("dotenv").config();
const Pool = require("pg").Pool;
console.log("hello", process.env.DB_USER);
const pool = new Pool({
  user: process.env.DB_USER,
  database: process.env.DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

//create a user
const createUser = (body) => {
  return new Promise(function (resolve, reject) {
    const { name, username, email, password } = body;
    pool.query(
      "INSERT INTO users (name, username, email, password) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, username, email, password],
      (error, results) => {
        if (error) {
          reject(error);
        }
        resolve(`A new user has been added added`);
      }
    );
  });
};
//delete a user
const deleteUser = () => {
  return new Promise(function (resolve, reject) {
    const id = parseInt(request.params.id);
    pool.query("DELETE FROM users WHERE id = $1", [id], (error, results) => {
      if (error) {
        reject(error);
      }
      resolve(`user deleted with ID: ${id}`);
    });
  });
};

//check if username exists
const findUsername = (username) => {
  return new Promise(function (resolve, reject) {
    pool.query(
      "SELECT EXISTS(SELECT 1 FROM users WHERE username = $1)",
      [username],
      (error, result) => {
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
const findEmail = (email) => {
  return new Promise(function (resolve, reject) {
    pool.query(
      "SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)",
      [email],
      (error, result) => {
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
const getPassword = (email) => {
  return new Promise(function (resolve, reject) {
    pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
      (error, results) => {
        if (error) {
          reject(error);
        }
        resolve(results.rows[0].password);
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
};
