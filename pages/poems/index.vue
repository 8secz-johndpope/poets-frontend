<template>
  <div>
    <b-container
      class="py-5"
      v-if="term">
      <h2 class="h3">{{ term.title }}</h2>
      <div v-html="term.body"/>
      <CardDeck
        v-if="featuredPoems"
        col-size="md"
        class="pt-5"
        title="Featured Poems"
        cardtype="PoemCard"
        :cards="featuredPoems"
      />
    </b-container>
    <b-container>
      <b-row>
        <b-col md="12">
          <app-form>
            <b-form-group class="table-filters">
              <div>
                <legend>Filter by</legend>
              </div>
              <b-form-select
                :disabled="busy"
                inline
                @input="searchPoems(0)"
                v-model="filters.field_occasion_tid"
                :options="options.occasions"
              >
                <template slot="first">
                  <option
                    :value="null"
                  >
                    Occasions</option>
                </template>
              </b-form-select>
              <b-form-select
                :disabled="busy"
                inline
                @input="searchPoems(0)"
                v-model="filters.field_poem_themes_tid"
                :options="options.themes"
              >
                <template slot="first">
                  <option
                    :value="null"
                  >
                    Themes</option>
                </template>
              </b-form-select>
              <b-form-select
                :disabled="busy"
                inline
                @input="searchPoems(0)"
                v-model="filters.field_form_tid"
                :options="options.form"
              >
                <template slot="first">
                  <option
                    :value="null"
                  >
                    Forms</option>
                </template>
              </b-form-select>

              <b-input-group class="table-filters__search">
                <b-form-input
                  :disabled="busy"
                  v-model="filters.combine"
                  type="text"
                  size="22"
                  placeholder="Search title or text ..."
                />
                <b-input-group-append
                  is-text
                  class="icon--search"
                >
                  <magnifying-glass-icon class="icon" />
                </b-input-group-append>
              </b-input-group>
            </b-form-group>
          </app-form>
        </b-col>
      </b-row>
    </b-container>

    <b-container>
      <b-table
        id="poems"
        :items="poems"
        :fields="fields"
        stacked="md"
        :per-page="perPage"
      >
        <template
          slot="title"
          slot-scope="data"
        >
          <a
            :href="data.item.view_node"
            v-html="replaceFileUrl(data.item.title)"
          />
        </template>
        <template
          slot="field_author"
          slot-scope="data"
        >
          <a
            v-html="data.item.field_author"
          />
        </template>
      </b-table>
      <div class="pager">
        <b-pagination
          @input="paginate"
          :disabled="busy"
          aria-controls="poems"
          class="pagination"
          hide-goto-end-buttons
          :per-page="perPage"
          size="lg"
          :total-rows="rows"
          v-model="page"
          align="fill"
        >
          <span slot="prev-text">
            <iconMediaSkipBackwards /> Prev
          </span>
          <span slot="next-text">
            Next
            <iconMediaSkipForwards />
          </span>
        </b-pagination>
      </div>
    </b-container>
  </div>
</template>

<script>
import _ from "lodash";
import { stringify } from "qs";
import filterHelpers from "~/plugins/filter-helpers";
import CardDeck from "~/components/CardDeck";
import iconMediaSkipBackwards from "~/static/icons/media-skip-backwards.svg";
import iconMediaSkipForwards from "~/static/icons/media-skip-forwards.svg";
import MagnifyingGlassIcon from "~/node_modules/open-iconic/svg/magnifying-glass.svg";
import MetaTags from "~/plugins/metatags";

// Helper to build out query
const buildQuery = (filters = {}) =>
  _.pickBy({
    combine: filters.combine,
    field_form_target_id: filters.field_form_tid,
    field_occasion_target_id: filters.field_occasion_tid,
    field_poem_themes_target_id: filters.field_poem_themes_tid
  });

// Helper to param stringify the filters
const buildParams = (filters = {}) => stringify(_.pickBy(filters));

// Helper to fetch featured poets
const buildFeaturesPoemsQuery = ({
  occasion = null,
  theme = null,
  form = null
} = {}) => {
  // Spin up the basic query
  const query = {
    filter: {
      status: 1
    },
    page: {
      limit: 3
    },
    sort: "-field_featured",
    include: "field_author"
  };
  // Add in the occasion if we need it
  if (!_.isNil(occasion)) {
    query.filter.occasion = {
      condition: {
        path: "field_occasion.tid",
        operator: "=",
        value: occasion
      }
    };
  }
  // Add in the theme if we need it
  if (!_.isNil(theme)) {
    query.filter.theme = {
      condition: {
        path: "field_poem_themes.tid",
        operator: "=",
        value: theme
      }
    };
  }
  // Add in the form if we need it
  if (!_.isNil(form)) {
    query.filter.form = {
      condition: {
        path: "field_form.tid",
        operator: "=",
        value: form
      }
    };
  }
  // Return
  return query;
};

// Helper to fetch a specific term
const buildTermQuery = id => ({
  filter: {
    drupal_internal__tid: id,
    status: 1
  },
  page: {
    limit: 1
  }
});

// Helper for us to get the "highest priority" term
const getPriorityTerm = ({
  field_occasion_tid = null,
  field_poem_themes_tid = null,
  field_form_tid = theme
} = {}) => {
  if (!_.isNil(field_occasion_tid))
    return { name: "occasions", id: field_occasion_tid };
  else if (!_.isNil(field_poem_themes_tid))
    return { name: "themes", id: field_poem_themes_tid };
  else if (!_.isNil(field_form_tid))
    return { name: "form", id: field_form_tid };
  else return {};
};

export default {
  components: {
    CardDeck,
    iconMediaSkipBackwards,
    iconMediaSkipForwards,
    MagnifyingGlassIcon
  },
  head() {
    return MetaTags.renderTags(this.$route, this.$store.state.metatags);
  },
  data() {
    return {
      busy: true,
      featuredPoems: [],
      fields: [
        {
          key: "title",
          label: "Title"
        },
        {
          key: "field_author",
          label: "Author"
        },
        {
          key: "field_date_published",
          label: "Year"
        }
      ],
      filters: {
        combine: null,
        field_form_tid: null,
        field_occasion_tid: null,
        field_poem_themes_tid: null
      },
      options: {
        occasions: [],
        themes: [],
        form: []
      },
      page: 1,
      pageCache: [],
      perPage: 20,
      poems: [],
      term: {},
      rows: 0
    };
  },
  mounted() {
    // Get all the data we need for search
    // NOTE: We need to start with our "null" defualts to make sure
    // the placeholders show up in the dropdowns
    this.filters = _.merge(this.filters, this.$route.query);
    // Get all the data we need for search
    Promise.all([
      this.searchPoems(),
      this.getFilter("occasions"),
      this.getFilter("themes"),
      this.getFilter("form")
    ]);
    // Spin up a debouncing func for text input
    this.debouncedSearchPoems = _.debounce(this.searchPoems, 700);
  },
  methods: {
    searchPoems(page = 0) {
      this.busy = true;
      const query = _.merge({}, buildQuery(this.filters), { page });
      this.$api.searchPoems({ query }).then(response => {
        this.page = _.get(response, "data.pager.current_page", 1) + 1;
        this.rows = _.get(response, "data.pager.total_items", 0);
        this.poems = this.rows > 0 ? _.get(response, "data.rows", []) : [];
        // Update the url so the search can be shared.
        // @NOTE: we want to use the raw filters not the query which is
        // parsed into things drupal needs
        const params = buildParams(this.filters);
        if (!_.isEmpty(params)) {
          window.history.pushState({}, "", `?${params}`);
        }
        // And finally set busy
        this.busy = false;
      });
      // Grab the movement and featured poets
      Promise.all([this.getTermDescription(), this.getFeaturedPoems()]);
      if (
        query.combine ||
        query.field_occasion_target_id ||
        query.field_poems_themes_target_id ||
        query.field_poem_themes_target_id ||
        query.page !== 0
      ) {
        let pageString = `/poems?page=${query.page}`;
        if (!_.isEmpty(query.combine)) {
          pageString += `&combine=${query.combine}`;
        }
        if (query.field_occasion_target_id) {
          pageString += `&field_occasion_tid=${query.field_occasion_target_id}`;
        }
        if (query.field_poem_themes_target_id) {
          pageString += `&field_poem_themes_tid=${
            query.field_poem_themes_target_id
          }`;
        }
        if (query.field_form_target_id) {
          pageString += `&field_form_tid=${query.field_form_target_id}`;
        }
        this.$ga.page(pageString);
      }
    },
    getFeaturedPoems() {
      const query = buildFeaturesPoemsQuery(this.filters);
      this.$api.getPoems({ query }).then(response => {
        this.featuredPoems = _(_.get(response, "data.data"))
          .filter(poem => _.has(poem, "relationships.field_author.data[0].id"))
          .map((poem, index) => ({
            aid: poem.relationships.field_author.data[0].id,
            link: poem.attributes.path.alias,
            title: poem.attributes.title,
            text: poem.attributes.body.processed,
            year: poem.attributes.field_copyright_date.split("-")[0],
            poet: {
              // @NOTE: the below assumes the index of the data and included
              // arrays match up
              name: _.get(response, `data.included[${index}].attributes.title`)
            }
          }))
          .value();
      });
    },
    getFilter(filter) {
      const fields = "name,drupal_internal__tid";
      const query = _.set({}, `fields[taxonomy_term--${filter}]`, fields);
      this.$api.getTerm(filter, { query }).then(response => {
        this.options[filter] = filterHelpers.map2Options(
          _.get(response, "data.data", [])
        );
      });
    },
    getTermDescription() {
      const priorityTerm = getPriorityTerm(this.filters);
      if (!_.isEmpty(priorityTerm)) {
        this.$api
          .getTerm(priorityTerm.name, {
            query: buildTermQuery(priorityTerm.id)
          })
          .then(response => {
            const first = _.first(_.get(response, "data.data", []));
            this.term = {
              title: _.get(first, "attributes.name"),
              body:
                _.get(first, "attributes.description.summary") ||
                _.get(first, "attributes.description.processed")
            };
          });
      }
    },
    paginate() {
      this.busy = true;
      // @NOTE: drupal starts at page 0, bPagination starts at 1
      // https://en.wikipedia.org/wiki/Off-by-one_error
      const queryPage = this.page - 1;
      this.searchPoems(queryPage);
      if (queryPage === 0) {
        this.$ga.page(`/poems?page=0`);
      }
    }
  },
  watch: {
    "filters.combine": function() {
      this.debouncedSearchPoems();
    }
  },
  async fetch({ app, store, query, route }) {
    return app.$buildBasicPage(app, store, "/poems");
  }
};
</script>

<style scoped lang="scss">
</style>
