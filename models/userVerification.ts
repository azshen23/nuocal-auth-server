import * as Pool from "pg";
const pool = new Pool.Pool();

const createUserVerification = async (body: any) => {
  return new Promise(function (resolve, reject) {
    const { userId, verificationCode } = body;
    var curr = new Date();
    var expired = new Date(curr.getTime() + 5 * 60000);
    pool.query(
      "INSERT INTO userVerification (userId, verificationCode, createdAt, expiresAt) VALUES ($1, $2, $3, $4) RETURNING *",
      [userId, verificationCode, curr, expired],
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
const deleteVerification = async (userId: number) => {
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

const findUserVerification = async (userId: number) => {
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
const getVerificationInfo = async (userId: number) => {
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
