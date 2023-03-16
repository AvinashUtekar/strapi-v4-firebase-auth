"use strict";

const schemaConfig = require("./schema-config");
const userSchema = require("../../../content-types/user/schema.json");

userSchema.config = schemaConfig;

module.exports = userSchema;
