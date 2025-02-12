// vinno vinno file theke schema gula import kore merge korbo ei mergeTypeDefs er maddhome
import { mergeTypeDefs } from "@graphql-tools/merge";
import { userSchema } from "./user.scheme";

export const mergedGQLSchema = mergeTypeDefs([userSchema]);
