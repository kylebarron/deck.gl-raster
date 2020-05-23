const { mergeWith } = require('docz-utils')
const fs = require('fs-extra')

let custom = {}
const hasGatsbyConfig = fs.existsSync('./gatsby-config.custom.js')

if (hasGatsbyConfig) {
  try {
    custom = require('./gatsby-config.custom')
  } catch (err) {
    console.error(
      `Failed to load your gatsby-config.js file : `,
      JSON.stringify(err),
    )
  }
}

const config = {
  pathPrefix: '/',

  siteMetadata: {
    title: 'Deck.gl Extended Layers',
    description: 'A collection of custom Deck.gl layers',
  },
  plugins: [
    {
      resolve: 'gatsby-theme-docz',
      options: {
        themeConfig: {},
        src: './',
        gatsbyRoot: null,
        themesDir: 'src',
        mdxExtensions: ['.md', '.mdx'],
        docgenConfig: {},
        menu: [],
        mdPlugins: [],
        hastPlugins: [],
        ignore: [],
        typescript: false,
        ts: false,
        propsParser: true,
        'props-parser': true,
        debug: false,
        native: false,
        openBrowser: null,
        o: null,
        open: null,
        'open-browser': null,
        root: '/Users/kyle/github/mapping/deck.gl-extended-layers/.docz',
        base: '/',
        source: './',
        'gatsby-root': null,
        files: '**/*.{md,markdown,mdx}',
        public: '/public',
        dest: '.docz/dist',
        d: '.docz/dist',
        editBranch: 'master',
        eb: 'master',
        'edit-branch': 'master',
        config: '',
        title: 'Deck.gl Extended Layers',
        description: 'A collection of custom Deck.gl layers',
        host: 'localhost',
        port: 3001,
        p: 3000,
        separator: '-',
        paths: {
          root: '/Users/kyle/github/mapping/deck.gl-extended-layers',
          templates:
            '/Users/kyle/github/mapping/deck.gl-extended-layers/node_modules/docz-core/dist/templates',
          docz: '/Users/kyle/github/mapping/deck.gl-extended-layers/.docz',
          cache:
            '/Users/kyle/github/mapping/deck.gl-extended-layers/.docz/.cache',
          app: '/Users/kyle/github/mapping/deck.gl-extended-layers/.docz/app',
          appPackageJson:
            '/Users/kyle/github/mapping/deck.gl-extended-layers/package.json',
          appTsConfig:
            '/Users/kyle/github/mapping/deck.gl-extended-layers/tsconfig.json',
          gatsbyConfig:
            '/Users/kyle/github/mapping/deck.gl-extended-layers/gatsby-config.js',
          gatsbyBrowser:
            '/Users/kyle/github/mapping/deck.gl-extended-layers/gatsby-browser.js',
          gatsbyNode:
            '/Users/kyle/github/mapping/deck.gl-extended-layers/gatsby-node.js',
          gatsbySSR:
            '/Users/kyle/github/mapping/deck.gl-extended-layers/gatsby-ssr.js',
          importsJs:
            '/Users/kyle/github/mapping/deck.gl-extended-layers/.docz/app/imports.js',
          rootJs:
            '/Users/kyle/github/mapping/deck.gl-extended-layers/.docz/app/root.jsx',
          indexJs:
            '/Users/kyle/github/mapping/deck.gl-extended-layers/.docz/app/index.jsx',
          indexHtml:
            '/Users/kyle/github/mapping/deck.gl-extended-layers/.docz/app/index.html',
          db:
            '/Users/kyle/github/mapping/deck.gl-extended-layers/.docz/app/db.json',
        },
      },
    },
  ],
}

const merge = mergeWith((objValue, srcValue) => {
  if (Array.isArray(objValue)) {
    return objValue.concat(srcValue)
  }
})

module.exports = merge(config, custom)
