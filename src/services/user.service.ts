import { IUserDocument } from "@src/interfaces/user.interface";
import { UserModel } from "@src/models/user.model";
import { Model, Op } from "sequelize";
import { omit, toLower, upperFirst } from "lodash";

export async function createNewUser(data: IUserDocument) {
  try {
    const result: Model = await UserModel.create(data);
    // remove the password field from the result

    const userData: IUserDocument = omit(result.dataValues, [
      "password",
    ]) as IUserDocument;

    return userData;
  } catch (err) {
    throw new Error(err);
  }
}

export async function getUserByUsernameOrEmail(
  username: string,
  email: string
) {
  try {
    const user: IUserDocument | undefined = (await UserModel.findOne({
      // raw:true means that the result will be plain JSON object in the user variable
      raw: true,
      where: {
        [Op.or]: [
          { username: upperFirst(username) },
          { email: toLower(email) },
        ],
      },
    })) as unknown as IUserDocument | undefined;
    return user;
  } catch (err) {
    throw new Error(err);
  }
}

export async function getUserBySocialId(
  socialId: string,
  email: string,
  type: string
): Promise<IUserDocument | undefined> {
  try {
    const user: IUserDocument | undefined = (await UserModel.findOne({
      raw: true,
      where: {
        [Op.or]: [
          {
            ...(type === "facebook" && {
              facebookId: socialId,
            }),
            ...(type === "google" && {
              googleId: socialId,
            }),
          },
          { email: toLower(email) },
        ],
      },
    })) as unknown as IUserDocument | undefined;
    return user;
  } catch (error) {
    throw new Error(error);
  }
}

export async function getUserByProp(
  prop: string,
  type: string
): Promise<IUserDocument | undefined> {
  try {
    const user: IUserDocument | undefined = (await UserModel.findOne({
      raw: true,
      where: {
        ...(type === "username" && {
          username: upperFirst(prop),
        }),
        ...(type === "email" && {
          email: toLower(prop),
        }),
      },
    })) as unknown as IUserDocument | undefined;
    return user;
  } catch (error) {
    throw new Error(error);
  }
}
