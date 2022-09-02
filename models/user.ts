const Pool = require("pg").Pool;
const pool = new Pool();

//create a user
async function createUser(body: any, prisma: any) {
  const { name, username, email, password } = body;
  const user = await prisma.users.create({
    data: {
      name: name,
      username: username,
      email: email,
      password: password,
    },
  });
  return user;
}

async function deleteUser(userId: number, prisma: any) {
  await prisma.users.delete({
    where: {
      id: userId,
    },
  });
}

//checks is username exists already by counting the number of users with that username
async function usernameExists(username: string, prisma: any) {
  const usernameCount = await prisma.users.count({
    where: {
      username: username,
    },
  });
  return usernameCount;
}

//check if email exists
async function emailExists(email: string, prisma: any) {
  const emailCount = await prisma.users.count({
    where: {
      email: email,
    },
  });
  return emailCount;
}

//get password from email

async function getPasswordFromEmail(email: string, prisma: any) {
  const user = await prisma.users.findUnique({
    where: {
      email: email,
    },
    select: {
      password: true,
    },
  });
  return user?.password;
}

async function getVerificationStatus(userId: number, prisma: any) {
  const user = await prisma.userverification.findUnique({
    where: {
      userid: userId,
    },
    select: {
      verified: true,
    },
  });
  return user?.verified;
}

//update verfied attribute
async function updateVerification(userId: number, prisma: any) {
  await prisma.users.update({
    where: {
      id: userId,
    },
    data: {
      verified: true,
    },
  });
}

module.exports = {
  createUser,
  deleteUser,
  usernameExists,
  emailExists,
  getPasswordFromEmail,
  getVerificationStatus,
  updateVerification,
};
