const axios = require("axios");
module.exports = {
    async signUp(ctx) {
        let { email = null, password = null, username = null } = ctx.request.body.data
        if (!(email && password && username)) return ctx.send({}, 400)
        let payload = JSON.stringify({
            email,
            password,
            returnSecureToken: true,
        });
        var config = {
            method: "post",
            url:
                "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=" +
                process.env.FIREBASE_API_KEY || "",
            headers: {
                "Content-Type": "application/json",
            },
            data: payload,
        };
        try {
            const resp = await axios(config);
            // get authenticated role id
            const authenticatedRole = await strapi.db
                .query('plugin::users-permissions.role')
                .findOne({
                    select: ["id"],
                    where: {
                        type: "authenticated",
                    }
                });

            // create user in strapi
            const strapiUser = await strapi.db
                .query('plugin::users-permissions.user')
                .create({
                    select: ["id", "email"],
                    data: {
                        email: resp.data.email,
                        uid: resp.data.localId,
                        username,
                        role: authenticatedRole.id
                    }
                });

            return ctx.send({ data: strapiUser, token: resp.data.idToken }, 200)
        } catch (error) {
            return ctx.send({ error: error.response.data }, error.response.status)
        }
    },
    async signIn(ctx) {
        let { email = null, password = null } = ctx.request.body.data
        if (!(email && password)) return ctx.send({}, 400)

        // check email is present in our database
        const isUserPresent = await strapi.db
            .query('plugin::users-permissions.user')
            .findOne({
                select: ["id", "email"],
                where: {
                    email,
                }
            });
        if (isUserPresent === null) return ctx.send({ error: "invalid credentials" }, 400)

        let data = JSON.stringify({
            email,
            password,
            returnSecureToken: true,
        });

        let config = {
            method: "post",
            url:
                "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" +
                process.env.FIREBASE_API_KEY || "",
            headers: {
                "Content-Type": "application/json",
            },
            data
        };
        try {
            resp = await axios(config);
            return ctx.send({ data: isUserPresent, token: resp.data.idToken }, 200)
        } catch (error) {
            return ctx.send({ error: error.response.data }, error.response.status)
        }
    }
}