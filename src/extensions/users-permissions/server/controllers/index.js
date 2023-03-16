'use strict';

const auth = require('@strapi/plugin-users-permissions/server/controllers/auth.js');
const user = require('./user');
const role = require('@strapi/plugin-users-permissions/server/controllers/role.js');
const permissions = require('@strapi/plugin-users-permissions/server/controllers/permissions.js');
const settings = require('@strapi/plugin-users-permissions/server/controllers/settings.js');
const contentmanageruser = require('@strapi/plugin-users-permissions/server/controllers/content-manager-user');


module.exports = {
  auth,
  user,
  role,
  permissions,
  settings,
  contentmanageruser,
};
