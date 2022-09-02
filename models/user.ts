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
  usernameExists,
  emailExists,
  getPasswordFromEmail,
  getVerificationStatus,
  updateVerification,
};
