import prisma from "../lib/prisma";

//create a user
async function createUser(body: any) {
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

async function deleteUser(userId: number) {
  await prisma.users.delete({
    where: {
      id: userId,
    },
  });
}

//checks is username exists already by counting the number of users with that username
async function usernameExists(username: string) {
  const usernameCount = await prisma.users.count({
    where: {
      username: username,
    },
  });
  return usernameCount;
}

//check if email exists
async function emailExists(email: string) {
  const emailCount = await prisma.users.count({
    where: {
      email: email,
    },
  });
  return emailCount;
}

async function getIDFromEmail(email: string) {
  const user = await prisma.users.findUnique({
    where: {
      email: email,
    },
    select: {
      id: true,
    },
  });
  return user?.id;
}

//get password from email
async function getIDPasswordFromEmail(email: string) {
  const user = await prisma.users.findUnique({
    where: {
      email: email,
    },
    select: {
      id: true,
      password: true,
    },
  });
  return user;
}

async function getVerificationStatus(userId: number) {
  const user = await prisma.users.findUnique({
    where: {
      id: userId,
    },
  });
  return user?.verified;
}

//update verfied attribute
async function updateVerification(userId: number) {
  await prisma.users.update({
    where: {
      id: userId,
    },
    data: {
      verified: true,
    },
  });
}

export default {
  createUser,
  deleteUser,
  usernameExists,
  emailExists,
  getIDFromEmail,
  getIDPasswordFromEmail,
  getVerificationStatus,
  updateVerification,
};
