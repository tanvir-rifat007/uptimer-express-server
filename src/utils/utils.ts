import { IAuthPayload } from "@src/interfaces/user.interface";
import { Request } from "express";
import { GraphQLError } from "graphql";
import { verify } from "jsonwebtoken";

export const isEmail = (email: string): boolean => {
  const regexExp =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/gi;
  return regexExp.test(email);
};

export const authenticateGraphQLRoute = async (req: Request) => {
  const token = req.session?.jwt;
  if (!token) {
    throw new GraphQLError("You are not authenticated");
  }

  try {
    const decoded: IAuthPayload = verify(
      token,
      process.env.JWT_TOKEN!
    ) as IAuthPayload;
    req.currentUser = decoded;
  } catch (err) {
    throw new GraphQLError("You are not authenticated");
  }
};
