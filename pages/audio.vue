<template>
  <div>
    <basic-page
      :body="$store.state.pageData.data.attributes.body"
      :highlighted="$store.state.highlightedData"
      :more="$store.state.relatedContent"
      :extended-content="$store.state.extendedContent"
      :sidebar-data="$store.state.sidebarData"/>
    <card-deck
      cardtype="PoemCard"
      :cards="featuredPoems.cards"/>
    <b-container class="poems-list__filters filters">
      <b-row class="poems-list__filters-row">
        <b-col md="12">
          <b-form
            class="poems-list__search"
            @submit.stop.prevent="applyFilters"
          >
            <b-form-group>
              <div class="legend-selects">
                <div class="poems-list__filters__legend">
                  <legend>Filter by</legend>
                </div>
              </div>
              <div class="poems-list__input--search">
                <b-input-group>
                  <b-form-input
                    v-model="combinedInput"
                    type="text"
                    size="22"
                    placeholder="Search title or text ..."
                  />
                  <b-input-group-append
                    is-text
                    @click.stop.prevent="applyFilters"
                  >
                    <magnifying-glass-icon
                      class="icon mr-2"/>
                  </b-input-group-append>
                </b-input-group>
              </div>
            </b-form-group>
          </b-form>
        </b-col>
      </b-row>
    </b-container>
    <b-container class="poems-list tabular-list">
      <b-row class="tabular-list__row tabular-list__header">
        <b-col md="3">
          Year
        </b-col>
        <b-col md="6">
          Title
        </b-col>
        <b-col md="3">
          Author
        </b-col>
      </b-row>
      <b-row
        v-for="poem in results"
        class="tabular-list__row poems-list__poems"
        :key="poem.id"
      >
        <b-col md="3">
          {{ poem.field_date_published }}
        </b-col>
        <b-col md="6">
          <b-link
            class="poem__link"
            :to="poem.view_node"
            v-html="poem.title"
          />
        </b-col>
        <b-col
          v-html="poem.field_author"
          md="2"/>
      </b-row>
      <div class="pager">
        <ul
          role="menubar"
          aria-disabled="false"
          aria-label="Pagination"
          class="pagination"
        >
          <li
            role="none presentation"
            aria-hidden="true"
            class="page-item"
            :class="{ disabled: !currentPage}"
          >
            <a
              :href="`/audio?page=${Prev}${preparedCombine}`"
              class="page-link"
            >
              <iconMediaSkipBackwards /> Prev
            </a>
          </li>
          <li
            role="none presentation"
            aria-hidden="true"
            class="page-item"
          >
            <a
              v-if="pageNum + 1 < totalPages"
              :href="`/audio?page=${pageNum + 1}{preparedCombine}`"
              class="page-link"
            >
              {{ pageNum + 1 }}
            </a>

          </li>
          <li
            role="none presentation"
            aria-hidden="true"
            class="page-item"
          >
            <a
              v-if="pageNum + 2 < totalPages"
              :href="`/audio?page=${pageNum + 2}${preparedCombine}`"
              class="page-link"
            >
              {{ pageNum + 2 }}
            </a>
          </li>

          <li
            role="none presentation"
            aria-hidden="true"
            class="page-item"
          >
            <a
              v-if="pageNum + 3 < totalPages"
              :href="`/audio?page=${pageNum + 3}${preparedCombine}`"
              class="page-link"
            >
              {{ pageNum + 3 }}
            </a>
          </li>
          <li
            role="none presentation"
            aria-hidden="true"
            class="page-item ellipsis"
          >
            <span>&hellip;</span>
          </li>
          <li
            role="none presentation"
            aria-hidden="true"
            class="page-item"
          >
            <a
              v-if="pageNum + 1 < totalPages"
              :href="`/audio?page=${totalPages - 1}${preparedCombine}`"
              class="page-link"
            >
              {{ totalPages }}
            </a>
          </li>
          <li
            role="none presentation"
            aria-hidden="true"
            class="page-item"
          >
            <a
              :href="`/audio?page=${Next}${preparedCombine}`"
              class="page-link"
              :class="{disabled: !Next}"
            >
              Next
              <iconMediaSkipForwards />
            </a>

          </li>
        </ul>
      </div>
    </b-container>
  </div>
</template>

<script>
import _ from "lodash";
import qs from "qs";
import BasicPage from "~/components/BasicPage";
import CardDeck from "~/components/CardDeck";
import searchHelpers from "~/plugins/search-helpers";
import iconMediaSkipBackwards from "~/static/icons/media-skip-backwards.svg";
import iconMediaSkipForwards from "~/static/icons/media-skip-forwards.svg";
import MagnifyingGlassIcon from "~/node_modules/open-iconic/svg/magnifying-glass.svg";

export default {
  components: {
    BasicPage,
    CardDeck,
    iconMediaSkipBackwards,
    iconMediaSkipForwards,
    MagnifyingGlassIcon
  },
  data() {
    return {
      combinedInput: null,
      results: null,
      Next: null,
      Prev: null,
      preparedCombine: null
    };
  },
  async asyncData({ app, params, query }) {
    const url = "/api/audio_poems";
    const results = await searchHelpers.getSearchResults(url, app, query);
    const featureParams = qs.stringify({
      filter: {
        soundcloud: {
          path: "field_soundcloud_embed_code",
          operator: "<>",
          value: ""
        },
        field_featured: 1
      },
      page: {
        limit: 3
      },
      include: "field_author"
    });
    const featured = await app.$axios.$get(`/api/node/poems?${featureParams}`);
    return _.merge(results, {
      featuredPoems: {
        response: featured,
        cards: _.map(featured.data, poem => ({
          title: _.get(poem, "attributes.title"),
          text:
            _.get(poem, "attributes.body.summary") ||
            _.get(poem, "attributes.body.processed"),
          poet: {
            name: _.get(
              _.find(
                featured.included,
                include =>
                  _.get(include, "id") ===
                  _.get(
                    _.first(_.get(poem, "relationships.field_author.data")),
                    "id"
                  )
              ),
              "attributes.title"
            )
          },
          year: _.get(poem, "attributes.field_date_published").split("-")[0],
          link: _.get(poem, "attributes.path.alias")
        }))
      }
    });
  },
  async fetch({ app, store, route }) {
    return app.$buildBasicPage(app, store, route.path);
  },
  methods: {
    applyFilters() {
      let myQuery = {};
      if (this.combinedInput) {
        myQuery.combine = this.combinedInput;
      }
      this.$router.push({
        name: "audio",
        query: myQuery
      });
    }
  },
  watchQuery: true
};
</script>

<style scoped lang="scss">
.poems-list__poems {
  font-weight: 400;
  a {
    color: $body-color;

    &:hover,
    &:focus,
    &:active {
      text-decoration: underline;
    }
  }
}
.tabular-list__header {
  background-color: #f2f8fa;
  text-transform: uppercase;
  font-weight: 560;
}
.poems-list {
  padding-top: 3rem;
  padding-bottom: 3rem;
}
.poems-list__search {
  margin-top: 2rem;
}
.poem__link {
  font-weight: 560;
}
.legend-selects {
  display: flex;
  flex-basis: 100%;
  padding: 1rem 1rem 1rem 2rem;
  border-right: $form__border;

  select {
    &:not(:last-child) {
      margin-right: 1rem;
    }
  }
}

.poems-list__filters__legend {
  flex-basis: 50%;

  legend {
    margin: 0;
    line-height: 2;
    font-size: $font-size-base;
    color: $gray-700;
  }
}

.poems-list__input--search {
  flex-basis: 100%;
  padding: 1rem;
  position: relative;

  input {
    border: none;
    background-color: transparent;

    &:hover,
    &:focus,
    &:active {
      border: none;
      background-color: transparent;
    }

    &::placeholder {
      color: $gray-700;
    }
  }

  button {
    width: 2rem;
    height: 2rem;
    display: flex;
    padding: 0;
    justify-content: center;
    position: absolute;
    top: 50%;
    right: 1rem;
    transform: translateY(-50%);
    background-color: transparent;
    border: none;

    &:hover,
    &:focus,
    &:active,
    &:active:focus {
      // Some really sticky rules getting applied from BS that need a bit of
      // force.
      background-color: transparent !important;
      box-shadow: none !important;
    }

    svg {
      width: 100%;
      height: 100%;
    }
  }
}
.icon {
  display: inline;
  fill: $blue;
  width: 1.4rem;
  height: 1.4rem;
}
.input-group-text {
  background: transparent;
  border: none;
}
</style>