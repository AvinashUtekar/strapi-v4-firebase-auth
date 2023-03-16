"use strict";

const { castArray, map } = require("lodash/fp");
const { ForbiddenError, UnauthorizedError } = require("@strapi/utils").errors;

const { getService } = require("@strapi/plugin-users-permissions/server/utils");
const getAdvancedSettings = () => {
  return strapi
    .store({ type: "plugin", name: "users-permissions" })
    .get({ key: "advanced" });
};

const authenticate = async (ctx) => {
  try {
    const token = await getService("jwt").getToken(ctx);
    if (token) {
      const { id } = token;

      if (id === undefined) {
        return { authenticated: false };
      }

      // fetch authenticated user
      const user = await getService("user").fetchAuthenticatedUser(id);

      if (!user) {
        return { error: "Invalid credentials" };
      }

      const advancedSettings = await getAdvancedSettings();

      if (advancedSettings.email_confirmation && !user.confirmed) {
        return { error: "Invalid credentials" };
      }

      if (user.blocked) {
        return { error: "Invalid credentials" };
      }

      ctx.state.user = user;

      return {
        authenticated: true,
        credentials: user,
      };
    }

    const publicPermissions = await strapi
      .query("plugin::users-permissions.permission")
      .findMany({
        where: {
          role: { type: "public" },
        },
      });

    if (publicPermissions.length === 0) {
      return { authenticated: false };
    }

    return {
      authenticated: true,
      credentials: null,
    };
  } catch (err) {
    //                  --- FIREBASE AUTH --- 

    const idToken = ctx.request.header.authorization.split(" ")[1];

    let decodedToken = null;

    // if token is invalid it will throws error
    try {
      decodedToken = await strapi.firebase.auth().verifyIdToken(idToken);
    } catch (error) {
      return { authenticated: false };
    }

    const strapiUser = await strapi
      .query('plugin::users-permissions.user')
      .findOne({
        select: ["id", "username", "email"],
        where: { email: decodedToken.email },
        populate: {
          role: {
            select: ["id"]
          }
        }
      });

    if (strapiUser === null) return { authenticated: false };

    ctx.state.user = strapiUser
    ctx.state.user.firebaseCreds = { ...decodedToken };

    return {
      authenticated: true,
      credentials: ctx.state.user,
    };
  }
};

const verify = async (auth, config) => {
  const { credentials: user } = auth;

  if (!config.scope) {
    if (!user) {
      // A non authenticated user cannot access routes that do not have a scope
      throw new UnauthorizedError();
    } else {
      // An authenticated user can access non scoped routes
      return;
    }
  }

  let allowedActions = auth.allowedActions;

  if (!allowedActions) {
    const permissions = await strapi
      .query("plugin::users-permissions.permission")
      .findMany({
        where: { role: user ? user.role.id : { type: "public" } },
      });

    allowedActions = map("action", permissions);
    auth.allowedActions = allowedActions;
  }

  const isAllowed = castArray(config.scope).every((scope) =>
    allowedActions.includes(scope)
  );

  if (!isAllowed) {
    throw new ForbiddenError();
  }
};

module.exports = {
  name: "users-permissions",
  authenticate,
  verify,
};