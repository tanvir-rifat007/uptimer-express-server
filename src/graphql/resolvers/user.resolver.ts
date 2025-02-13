import {
  IAuthPayload,
  IUserDocument,
  IUserResponse,
} from "@src/interfaces/user.interface";
import {
  createNewUser,
  getUserByProp,
  getUserBySocialId,
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
import { authenticateGraphQLRoute, isEmail } from "@src/utils/utils";
import { UserModel } from "@src/models/user.model";
import logger from "@src/server/logger";
import { AppContext } from "@src/interfaces/monitor.interface";

export const UserResolver = {
  Query: {
    async checkCurrentUser(
      _parent: undefined,
      _args: undefined,
      contextValue: AppContext
    ) {
      const { req } = contextValue;

      authenticateGraphQLRoute(req);

      logger.info(req.currentUser as IAuthPayload);

      const notifications = await getAllNotificationGroupsByUserId(
        req.currentUser?.id!
      );

      return {
        user: {
          id: req.currentUser?.id,
          username: req.currentUser?.username,
          email: req.currentUser?.email,
          createdAt: new Date(),
        },
        notifications,
      };
    },
  },

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
    async loginUser(
      _: undefined,
      args: { username: string; password: string },
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      const { username, password } = args;

      const isValidEmail = isEmail(username);
      const type: string = !isValidEmail ? "username" : "email";
      const existingUser: IUserDocument | undefined = await getUserByProp(
        username,
        type
      );
      if (!existingUser) {
        throw new GraphQLError("Invalid credentials");
      }
      const passwordsMatch: boolean = await UserModel.prototype.comparePassword(
        password,
        existingUser.password!
      );
      if (!passwordsMatch) {
        throw new GraphQLError("Invalid credentials");
      }
      const response: IUserResponse = await userReturnValue(
        req,
        existingUser,
        "login"
      );
      return response;
    },

    async authSocialUser(
      _: undefined,
      args: { user: IUserDocument },
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      const { user } = args;
      const { username, email, socialId, type } = user;
      const checkIfUserExist: IUserDocument | undefined =
        await getUserBySocialId(socialId!, email!, type!);
      if (checkIfUserExist) {
        const response: IUserResponse = await userReturnValue(
          req,
          checkIfUserExist,
          "login"
        );
        return response;
      } else {
        const authData: IUserDocument = {
          username: upperFirst(username),
          email: toLower(email),
          ...(type === "facebook" && {
            facebookId: socialId,
          }),
          ...(type === "google" && {
            googleId: socialId,
          }),
        } as IUserDocument;
        const result: IUserDocument | undefined = await createNewUser(authData);
        const response: IUserResponse = await userReturnValue(
          req,
          result,
          "register"
        );
        return response;
      }
    },

    logout(_parent: undefined, _args: undefined, contextValue: AppContext) {
      const { req } = contextValue;
      req.session = null;
      return { message: "Logout successfully" };
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
