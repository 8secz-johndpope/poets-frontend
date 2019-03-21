<template>
  <div>
    <b-container class="py-5">
      <b-row>
        <b-col lg="7">
          <h1>{{ title }}</h1>
          <b-img-lazy
            right
            class="event__image mb-4"
            :src="image.src"
            :alt="image.alt"/>

          <div
            v-if="body"
            v-html="body"
            class="event__body"/>
        </b-col>
        <b-col
          tag="aside"
          lg="4"
          class="event__aside"
          offset-lg="1">
          <div class="event-date-time mt-3 pb-3">
            <h3 class="event__field-header">Date and Time</h3>
            <div class="event__field-body">
              <p v-if="eventDate">{{ eventDate }}<br>
                {{ eventStartTime }} - {{ eventEndTime }}</p>
            </div>
          </div>
          <div class="event-location mt-3 pb-5">
            <h3 class="event__field-header">Location</h3>
            <address class="event__field-body">
              <span v-if="location.company">{{ location.company }}<br></span>
              <span v-if="location.address1">{{ location.address1 }}<br></span>
              <span v-if="location.address2">{{ location.address2 }}<br></span>
              <span v-if="location.locality">{{ location.locality }},&nbsp;</span>
              <span v-if="location.state">{{ location.state }}</span>&nbsp;
              <span v-if="location.zip">{{ location.zip }}</span><br>
              <a
                v-if="mapLink"
                class="external event__link"
                :href="mapLink"
                target="_blank">View Map</a>
            </address>

            <b-button
              v-if="registerLink"
              variant="primary-dark"
              target="_blank"
              class="external"
              size="lg"
              :href="registerLink.uri"
            >{{ registerLink.title }}</b-button>

          </div>

          <div class="event-registration my-5">
            <h3>Interested in being
            considered?</h3>
            <p>To be considered for #PoetryNearYou Pick of the Week, we invite you to become a registered user of Poets.org for free and to use our online calendar Poetry Near You to promote local events in your community.</p>
            <p>
              <span v-if="eventFee">Admission Fee:
                <strong>$ {{ eventFee }}</strong><br>
              </span>
              Contact: <a href="#">{{ contact }}</a><br>
              {{ eventDate }}</p>
          </div>
        </b-col>
      </b-row>
    </b-container>

    <b-container class="events-list tabular-list">
      <h2 class="font-serif">Poetry Near You</h2>
      <app-listing
        resource-type="events"
        :details="details"
        :default-params="defaultParams"
        :includes="includes"
        :filters="filters"
        :searchable="searchable"
        :fields="fields"/>
    </b-container>
  </div>
</template>

<script>
import _ from "lodash";
import AppListing from "~/components/AppListing";
import MetaTags from "~/plugins/metatags";

export default {
  layout: "default",
  components: { AppListing },
  data() {
    return {
      details: {
        body: {},
        event_start_time: {},
        field_location: {},
        register_link: {}
      },
      includes: {},
      fields: {
        field_event_date: { label: "Date" },
        title: { label: "Name" },
        field_location: { label: "Location" }
      },
      defaultParams: {},
      filters: [],
      searchable: [
        { field: "title", label: "name" },
        {
          field: "body.value",
          label: "text"
        }
      ]
    };
  },
  head() {
    return MetaTags.renderTags(this.tags);
  },
  async asyncData({ app, route }) {
    const routerResponse = await app.$axios.$get(
      `/router/translate-path?path=${route.path}`
    );

    return app.$axios
      .$get(routerResponse.jsonapi.individual + "?include=field_image")
      .then(event => ({
        title: _.get(event, "data.attributes.title"),
        body: _.get(event, "data.attributes.body.processed"),
        eventDate: _.get(event, "data.attributes.field_event_date"),
        eventStartTime: _.get(event, "data.attributes.event_start_time"),
        eventEndTime: _.get(event, "data.attributes.event_end_time"),
        image: app.$buildImg(event, null, "field_image", "event"),
        contact: _.get(event, "data.attributes.field_event_contact"),
        eventFee: _.get(event, "data.attributes.field_event_fee"),
        registerLink: _.get(event, "data.attributes.register_link"),
        location: {
          company: _.get(event, "data.attributes.field_location.organization"),
          address1: _.get(
            event,
            "data.attributes.field_location.address_line1"
          ),
          address2: _.get(
            event,
            "data.attributes.field_location.address_line2"
          ),
          locality: _.get(event, "data.attributes.field_location.locality"),
          state: _.get(
            event,
            "data.attributes.field_location.administrative_area"
          ),
          zip: _.get(event, "data.attributes.field_location.postal_code")
        },
        mapLink: _.get(event, "data.attributes.link_google_map.uri"),
        tags: _.get(event, "data.attributes.metatag_normalized")
      }));
  },
  async fetch({ store }) {
    store.commit("updateHero", {
      heading: "Poetry Near You",
      lead:
        "Are you looking to connect with poets or find opportunities to hear or study poetry? To find poetry events and resources near you, simply enter your zip code in the search field below."
    });
  }
};
</script>

<style scoped lang="scss">
.event__body {
  font-weight: 400;
  color: $indigo;
}
.event__field-header {
  font-weight: 600;
  font-size: 1.625rem;
  line-height: 1.25;
  color: $indigo;
}
.event__field-body {
  font-size: 1.25rem;
  font-weight: 400;
  color: $indigo;
}
.event__link {
  font-weight: 600;
}
.event-registration {
  background-color: var(--white);
  padding: 2rem;
  border: 1px solid $gray-400;
  font-weight: 400;
  color: $indigo;
  strong {
    color: $black;
  }
}
@include media-breakpoint-up(md) {
  .event__aside {
    padding-left: 40px;
  }
}
</style>