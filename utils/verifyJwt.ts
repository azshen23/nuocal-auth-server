import jwt from "jsonwebtoken";
export interface User {
  id: number;
  email: string;
}

export async function decodeAndVerifyJwtToken(token: string) {
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!, (err, user) => {
    if (err) console.log(err);
    return user;
  });
}

export async function decodeAndVerifyRefreshToken(token: string) {
  const decodedToken = jwt.verify(
    token,
    process.env.REFRESH_TOKEN_SECRET!
  ) as User;
  if (!decodedToken) throw new Error("error decoding refresh token");
  return decodedToken;
}
