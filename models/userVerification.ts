import * as Pool from "pg";
const pool = new Pool.Pool();

const createUserVerification = (body: any) => {
  return new Promise(function (resolve, reject) {
    const { userId, verificationCode } = body;
    pool.query(
      "INSERT INTO userVerification (userId, verificationCode, createdAt, expiresAt) VALUES ($1, $2, current_timestamp, current_timestamp + '48 hours') RETURNING *",
      [userId, verificationCode],
      (error: any, results: any) => {
        if (error) {
          reject(error);
        }
        resolve("successfullly created user verification email record");
      }
    );
  });
};

//delete a verifcation record
const deleteVerification = (userId: number) => {
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

const findUserVerification = (userId: number) => {
  return new Promise(function (resolve, reject) {
    pool.query(
      "SELECT EXISTS(SELECT 1 FROM userVerification WHERE userId = $1)",
      [userId],
      (error, result) => {
        if (error) {
          reject(error);
        }

        resolve(`email found with userId: ${userId}`);
      }
    );
  });
};

//get values from userId
const getVerificationInfo = (userId: number) => {
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
