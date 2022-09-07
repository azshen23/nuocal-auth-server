import prisma from "../lib/prisma";
//create a user
async function createUserVerification(body: any) {
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
async function deleteVerification(userId: number) {
  await prisma.userverification.delete({
    where: {
      userid: userId,
    },
  });
}

async function findUserVerification(userId: number) {
  const emailCount = await prisma.userverification.count({
    where: {
      userid: userId,
    },
  });
  return emailCount;
}

//get values from userId
async function getVerificationInfo(userId: number) {
  const user = await prisma.userverification.findUnique({
    where: {
      userid: userId,
    },
    select: {
      verificationcode: true,
      expiresat: true,
    },
  });
  return user;
}

module.exports = {
  deleteVerification,
  findUserVerification,
  getVerificationInfo,
  createUserVerification,
};
