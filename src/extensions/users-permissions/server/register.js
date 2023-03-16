"use strict";

const authStrategy = require("./strategies/users-permissions");
const sanitizers = require("@strapi/plugin-users-permissions/server/utils/sanitize/sanitizers");

module.exports = ({ strapi }) => {
    strapi.container.get("auth").register("content-api", authStrategy);
    strapi.sanitizers.add("content-api.output", sanitizers.defaultSanitizeOutput);

    if (process.env.NODE_ENV !== "development") {
        strapi.config.set(
            "plugin.users-permissions.jwtSecret",
            process.env.JWT_SECRET
        );
    }

    if (strapi.plugin("graphql")) {
        require("@strapi/plugin-users-permissions/server/graphql")({ strapi });
    }
};
