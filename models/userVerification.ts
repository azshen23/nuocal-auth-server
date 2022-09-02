import * as Pool from "pg";
const pool = new Pool.Pool();

//create a user
async function createUserVerification(body: any, prisma: any) {
  const { userId, verificationCode } = body;
  var curr = new Date();
  var expired = new Date(curr.getTime() + 5 * 60000);
  const userVer = await prisma.userverification.create({
    data: {
      userid: userId,
      verificationcode: verificationCode,
      createdat: curr.toString(),
      expiresat: expired.toString(),
    },
  });
  return userVer;
}

//delete a verifcation record
async function deleteVerification(userId: number, prisma: any) {
  await prisma.userverification.delete({
    where: {
      userid: userId,
    },
  });
}

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
