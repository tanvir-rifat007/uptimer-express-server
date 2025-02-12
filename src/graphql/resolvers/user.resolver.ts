import { IUserDocument, IUserResponse } from "@src/interfaces/user.interface";
import { AppContext } from "@src/server/server";
import {
  createNewUser,
  getUserByUsernameOrEmail,
} from "@src/services/user.service";
import { GraphQLError } from "graphql";
import { toLower, upperFirst } from "lodash";
import { sign } from "jsonwebtoken";
import { Request } from "express";
import { INotificationDocument } from "@src/interfaces/notification.interface";
import {
  createNotificationGroup,
  getAllNotificationGroupsByUserId,
} from "@src/services/notification.service";
import { JWT_TOKEN } from "@src/server/config";

export const UserResolver = {
  Mutation: {
    async registerUser(
      _parent: undefined,
      args: { user: IUserDocument },
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      const { user } = args;

      const { username, email, password } = user;
      // call the service function for the user;
      const checkIfUserExist = await getUserByUsernameOrEmail(
        username!,
        email!
      );

      if (checkIfUserExist) {
        throw new GraphQLError("User already exist");
      }

      const authData: IUserDocument = {
        username: upperFirst(username!),
        email: toLower(email!),
        password,
      } as IUserDocument;

      // create the user
      const createdUser = await createNewUser(authData);

      return userReturnValue(req, createdUser, "register");
    },
  },
  // Here in the user.scheme.ts file, I define the user createdAt as type String
  // but in the user.interface.ts file, I define the createdAt as type Date. Because I save the createdAt as Date type in the database.

  // so that's why I need to convert the createdAt to String type in the userReturnValue function.
  User: {
    createdAt: (user: IUserDocument) => new Date(user.createdAt!).toISOString(),
  },
};

async function userReturnValue(
  req: Request,
  result: IUserDocument,
  type: string
): Promise<IUserResponse> {
  let notifications: INotificationDocument[] = [];
  if (type === "register" && result && result.id && result.email) {
    const notification = await createNotificationGroup({
      userId: result.id,
      groupName: "Default Contact Group",
      emails: JSON.stringify([result.email]),
    });
    notifications.push(notification);
  } else if (type === "login" && result && result.id && result.email) {
    notifications = await getAllNotificationGroupsByUserId(result.id);
  }

  // create the jwt token for the user
  const userJwt: string = sign(
    {
      id: result.id,
      email: result.email,
      username: result.username,
    },
    JWT_TOKEN
  );
  req.session = { jwt: userJwt, enableAutomaticRefresh: false };
  const user: IUserDocument = {
    id: result.id,
    email: result.email,
    username: result.username,
    createdAt: result.createdAt,
  } as IUserDocument;
  return {
    user,
    notifications,
  };
}
