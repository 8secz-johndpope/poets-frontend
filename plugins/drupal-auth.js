import _ from "lodash";
import jwtDecode from "jwt-decode";
import PoetsApi from "~/plugins/poets-apiv2";
import PoetsUser from "~/plugins/poets-user";

/*
 * Helper to build token
 */
const buildToken = (token, type = "Bearer") => type + " " + token;

/*
 * Helper to validate whether user is fetchable
 */
const validateFetchable = (user, env = process.env) =>
  _.has(user, "id") && _.has(env, "baseURL") && _.has(env, "CONSUMER_ID");

/**
 * A Drupal login scheme for nuxt auth module
 */
export default class DrupalScheme {
  /**
   * Build me a DrupalScheme worthy of nuxt auth-module
   *
   * @param {Object} auth
   * @param {Object} options
   * @param {Object} data
   */
  constructor(auth, options, data) {
    this.$auth = auth;
    this.api = new PoetsApi(this.$auth.ctx.$axios);
    this.name = options._name;
    this.options = options;
  }

  /**
   * Return the scope from the options
   */
  get _scope() {
    return Array.isArray(this.options.scope)
      ? this.options.scope.join(" ")
      : this.options.scope;
  }

  /**
   * Make sure we set the axios token when we can
   */
  async mounted() {
    // Sync token and user if applicable
    const token = this.$auth.syncToken(this.name);
    const user = this.$auth.$storage.syncUniversal("user", {}, true);
    // Set axios token
    if (token) {
      this._setToken(token);
    }
    // Set the user with the full data model
    if (validateFetchable(user, this.$auth.ctx.env)) {
      // Set thet basicz
      const minUser = new PoetsUser(user.id, this.api, user);
      this.$auth.setUser(minUser);
      // Fetch additional metadata
      // @TODO: do we want to fetch additional metdata eventually?
      this.$auth.fetchUser().then(user => {
        this.$auth.setUser(user);
        this.$auth.user.pullAnthologies();
      });
    }
    // If we cant fetch a user then lets clean the slate
    else {
      this.$auth.logout();
    }
  }

  /**
   * Set the token since axios for all requests
   *
   * @param {String} token
   */
  _setToken(token) {
    // Set Authorization token for all axios requests
    this.$auth.ctx.app.$axios.setHeader("Authorization", token);
  }

  /**
   * Set the token
   *
   * @param {String} token
   */
  _clearToken() {
    // Clear Authorization token for all axios requests
    this.$auth.ctx.app.$axios.setHeader("Authorization", false);
  }

  /**
   * Logout of the drupals and the nuxts
   */
  async logout() {
    this._clearToken();
    this.$auth.$storage.setUniversal("user", Boolean(false));
    this.$auth.$storage.setUniversal("loggedIn", Boolean(false));
    return this.$auth.reset();
  }

  /**
   * Accept the Drupal stuff and login
   * @param {String} username
   * @param {String} password
   */
  async login(username, password) {
    // Build up our form dataz
    let bodyFormData = new FormData();
    bodyFormData.set("username", username);
    bodyFormData.set("password", password);
    bodyFormData.set("grant_type", "password");
    bodyFormData.set("client_id", process.env.CONSUMER_ID);
    bodyFormData.set("response_type", "token");
    bodyFormData.set("token_type", "Bearer");

    // Try to get us a token!
    return this.$auth
      .request({
        method: "post",
        url: "/oauth/token",
        baseURL: process.env.baseURL,
        data: bodyFormData,
        options: {
          headers: { "Content-Type": "multipart/form-data" }
        }
      })
      .then(data => {
        // Reject if we dont have the token, this should be impossible?
        if (!_.has(data, "access_token")) {
          return Promise.reject({ error: "empty_token" });
        }
        // Decode the access token and validate
        if (!_.has(jwtDecode(data.access_token), "sub")) {
          return Promise.reject({ error: "empty_user" });
        }
        // Build me, and store me a token worthy of drupal
        const token = buildToken(data.access_token, data.token_type);
        // Store token
        this.$auth.setToken(this.name, token);
        // Set axios token
        this._setToken(token);
        // Set the user, we need to augment this in fetch user
        const user = new PoetsUser(jwtDecode(data.access_token).sub, this.api);
        this.$auth.setUser(user);
        // Store refresh token if we can
        if (data.refresh_token && data.refresh_token.length) {
          this.$auth.setRefreshToken(
            this.name,
            buildToken(data.refresh_token, data.token_type)
          );
        }
        // Return all good
        return true;
      })
      .catch(err => Promise.reject(err));
  }

  /**
   * Get the user profile data from Drupal
   */
  async fetchUser() {
    // Validate that we have a token\
    if (!this.$auth.getToken(this.name)) {
      return Promise.reject({ error: "no_token" });
    }
    // Validate that we can fetch data
    if (!validateFetchable(this.$auth.user, this.$auth.ctx.env)) {
      return Promise.reject({ error: "no_id_or_env" });
    }

    // Get the user and then pull the data
    const minUser = new PoetsUser(this.$auth.user.id, this.api);
    return minUser.pullUser().then(data => {
      // Set the full user
      const user = new PoetsUser(data.id, this.api, data);
      // Persist "core" user data for performance reasons, on a page load we will
      // lazy load the rest of the properties
      // NOTE: this should be the set of properties we need to be able to
      // 1. render a page quickly with "profile" info, eg a picture or name
      // 2. handle any biz/controller logic without having to make an http request first
      const corePropz = _.pick(user.getUser(), [
        "drupal_internal__uid",
        "field_first_name",
        "field_last_name",
        "field_membership_status",
        "id",
        "langcode",
        "mail",
        "name",
        "timezone"
      ]);
      this.$auth.$storage.setUniversal("user", corePropz, true);
      this.$auth.$storage.setUniversal("loggedIn", true);
      return user;
    });
  }
}
