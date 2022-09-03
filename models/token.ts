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

async function refreshTokenExists(token: any, prisma: any) {
  console.log(token.token);
  const tokenCount = await prisma.refreshtokens.count({
    where: {
      token: token.token,
    },
  });
  return tokenCount;
}

module.exports = {
  addNewRefreshToken,
  refreshTokenExists,
};
