module.exports = {
    routes: [
        {
            method: "POST",
            path: "/auth/sign-up",
            handler: "auth.signUp",
            config: {
                policies: [],
            },
        },
        {
            method: "POST",
            path: "/auth/sign-in",
            handler: "auth.signIn",
            config: {
                policies: [],
            },
        }
    ],
};
