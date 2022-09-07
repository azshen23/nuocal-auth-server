import prisma from "../lib/prisma";

async function addNewRefreshToken(token: string, userID: number) {
  const tokenData = await prisma.refreshtokens.create({
    data: {
      token: token,
      userid: userID,
    },
  });

  return tokenData;
}
//TO DO WHY IS TOKEN ANY
async function refreshTokenExists(token: any) {
  const tokenCount = await prisma.refreshtokens.count({
    where: {
      token: token.token,
    },
  });
  return tokenCount;
}

async function deleteRefreshToken(token: any) {
  await prisma.refreshtokens.delete({
    where: {
      token: token.token,
    },
  });
}

module.exports = {
  addNewRefreshToken,
  refreshTokenExists,
  deleteRefreshToken,
};
