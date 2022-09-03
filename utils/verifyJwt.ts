import jwt from "jsonwebtoken";
export interface User {
  email: string;
}

export async function decodeAndVerifyJwtToken(token: string) {
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!, (err, user) => {
    if (err) console.log("error");
    return user;
  });
}

export async function decodeAndVerifyRefreshToken(token: string) {
  const decodedToken = jwt.verify(
    token,
    process.env.REFRESH_TOKEN_SECRET!
  ) as User;
  return decodedToken;
}
