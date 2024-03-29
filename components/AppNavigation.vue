<template>
  <div class="app-nav__container">
    <b-navbar
      toggleable="md"
      type="dark"
      class="shadow-sm d-flex"
      variant="dark"
    >
      <b-navbar-brand
        tag="div"
        class="btn btn-md d-flex flex-row"
      >
        <b-link
          to="/"
          class="d-inline-flex flex-row"
        >Poets.org</b-link>
        <span class="oi oi-caret-bottom d-inline-flex d-sm-inline-flex d-md-none flex-row" />
      </b-navbar-brand>

      <b-navbar-toggle
        label="Menu"
        class="border-0"
        target="nav_collapse"
      />
      <b-collapse
        is-nav
        id="nav_collapse"
      >
        <app-mobile-menu
          class="d-flex d-md-none" />
        <b-navbar-nav
          class="menu--desktop d-none d-md-flex">
          <b-nav-item
            v-show="!sparse"
            v-for="(link, index) in $store.state.topMenu"
            :key="index"
            :to="link.to"
          >{{ link.text }}</b-nav-item>
          <b-nav-item
            v-show="this.$auth.loggedIn && !sparse"
            class="d-md-none"
            to="/dashboard"
          >Dashboard</b-nav-item>
          <b-nav-item
            v-show="!this.$auth.loggedIn && !sparse"
            class="d-md-none"
            @click="logout"
          >Logout</b-nav-item>
        </b-navbar-nav>

        <!-- Right aligned nav items -->
        <b-navbar-nav
          v-show="!sparse"
          class="ml-auto">
          <b-nav-item
            v-show="!this.$auth.loggedIn"
            to="/login"
            class="navbar__login"
          >Login</b-nav-item>
          <b-nav-item-dropdown
            v-show="this.$auth.loggedIn"
            class="d-none"
            :class="dropdownClass"
            id="nav_ddown_loggedin"
            :text="name"
            extra-toggle-classes="nav-link-loggedin"
            right
          >
            <b-dropdown-item href="/dashboard">Dashboard</b-dropdown-item>
            <b-dropdown-divider />
            <b-dropdown-item @click="logout">Logout</b-dropdown-item>
          </b-nav-item-dropdown>
          <b-nav-item
            class="app-nav__membership"
            to="/membership"
            right>
            Membership
          </b-nav-item>
          <b-button
            v-b-toggle.nav_collapse
            class="d-block py-2 d-md-none"
            variant="secondary-dark"
            size="md"
            href="/donate/monthly"
          >Donate</b-button>
        </b-navbar-nav>

      </b-collapse>
      <b-button
        v-if="!sparse"
        v-b-toggle.nav_collapse
        class="d-none d-md-flex"
        variant="secondary-dark"
        size="md"
        href="/donate/monthly"
      >Donate</b-button>
    </b-navbar>
    <b-button
      v-if="!sparse"
      v-b-toggle.nav_collapse
      class="d-block py-2 d-md-none"
      variant="secondary-dark"
      size="md"
      href="/donate/monthly"
    >Donate</b-button>
  </div>
</template>

<script>
import { get, isNil } from "lodash";
import AppMobileMenu from "~/components/AppMobileMenu";
/*
 * Helper to get name
 */
const getName = (first = "My", last = "Account", name = "My Account") => {
  // Use the username if we dont have first/last
  if (isNil(first) && isNil(last)) {
    return name;
  }
  if (isNil(first)) {
    first = "My";
  }
  if (isNil(last)) {
    last = "Account";
  }
  return `${first} ${last}`;
};
export default {
  components: { AppMobileMenu },
  props: {
    sparse: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    name() {
      return getName(
        get(this.$auth, "user.meta.field_first_name", undefined),
        get(this.$auth, "user.meta.field_last_name", undefined),
        get(this.$auth, "user.meta.name", undefined)
      );
    },
    dropdownClass() {
      return this.$auth.loggedIn ? "d-md-flex" : "";
    }
  },
  methods: {
    logout() {
      this.$auth.logout();
      // Hard reload where we at
      window.location.reload(true);
    }
  }
};
</script>

<style scoped lang="scss">
// So we can access breakpoints / spacer
@import "~bootstrap/scss/functions";
@import "~bootstrap/scss/variables";
@import "~bootstrap/scss/mixins";

// mobile
.navbar-brand {
  align-items: center;
  background-color: var(--black);
  flex-grow: 1;
  justify-content: space-between;
  border: none;

  a {
    color: var(--blue-lightest);
  }

  // caret
  .oi {
    color: var(--blue-lightest);
    align-self: center;
  }
}

.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1020;
  align-items: stretch;
  text-align: center;

  @include media-breakpoint-up(md) {
    position: static;
  }

  .btn {
    border-radius: 0;
  }
}

// This is to make the hover take up the whole nav on desktop
.navbar-nav {
  @include media-breakpoint-up(md) {
    height: 100%;
  }
}

.nav-item {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background-color: var(--black);
  }
}
// Desktop
@include media-breakpoint-up(md) {
  .navbar-brand {
    // reset the size of the brand element
    flex-grow: 0;
    // reset the padding on brand tag
    a {
      padding-top: initial;
      padding-left: initial;
    }
  }

  .navbar {
    .btn {
      // More spacious buttons
      padding: 20px;
    }
  }
  .navbar__login a {
    // a slight bit tighter on this link
    padding-right: $spacer * 0.75 !important;
  }
}
.app-nav__membership {
  background-color: var(--blue);
}
</style>
