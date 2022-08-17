const Pool = require("pg").Pool;
const pool = new Pool();

const createUserVerification = (body) => {
  return new Promise(function (resolve, reject) {
    const { userId, uniqueString, createdAt, expiresAt } = body;
    pool.query(
      "INSERT INTO userVerification (userId, uniqueString, createdAt, expiresAt) VALUES ($1, $2, to_timestamp($3 / 1000.0), to_timestamp($4 / 1000.0)) RETURNING *",
      [userId, uniqueString, createdAt, expiresAt],
      (error, results) => {
        if (error) {
          reject(error);
        }
        resolve("successfullly created user verification email record");
      }
    );
  });
};

//delete a verifcation record
const deleteVerification = (userId) => {
  return new Promise(function (resolve, reject) {
    pool.query(
      "DELETE FROM userVerification WHERE userId = $1",
      [userId],
      (error, results) => {
        if (error) {
          reject(error);
        }
        resolve(`user deleted with userId: ${userId}`);
      }
    );
  });
};

const findUserVerification = (userId) => {
  return new Promise(function (resolve, reject) {
    pool.query(
      "SELECT EXISTS(SELECT 1 FROM userVerification WHERE userId = $1)",
      [userId],
      (error, result) => {
        if (error) {
          reject(error);
        }
        if (result.rows[0].exists == false) {
          resolve(null);
        } else {
          resolve(`email found with userId: ${userId}`);
        }
      }
    );
  });
};

//get values from userId
const getVerificationInfo = (userId) => {
  return new Promise(function (resolve, reject) {
    pool.query(
      "SELECT * FROM userVerification WHERE userId = $1",
      [userId],
      (error, results) => {
        if (error) {
          reject(error);
        }
        resolve(results.rows[0]);
      }
    );
  });
};

module.exports = {
  deleteVerification,
  findUserVerification,
  getVerificationInfo,
  createUserVerification,
};
