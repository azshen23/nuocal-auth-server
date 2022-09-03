async function addNewRefreshToken(token: string, userID: number, prisma: any) {
  console.log(token, userID);
  const tokenData = await prisma.refreshtokens.create({
    data: {
      token: token,
      userid: userID,
    },
  });

  return tokenData;
}
//TO DO WHY IS TOKEN ANY
async function refreshTokenExists(token: any, prisma: any) {
  console.log(token.token);
  const tokenCount = await prisma.refreshtokens.count({
    where: {
      token: token.token,
    },
  });
  return tokenCount;
}

async function deleteRefreshToken(token: any, prisma: any) {
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
