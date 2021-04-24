module.exports = {
  mount: { src: '/', data: '/', '.' : '/' },
  plugins: ['@snowpack/plugin-sass',[
    '@jsonkao/snowpack-plugin-posthtml',
    {
      root: './src'
    },
  ],],
  exclude: [
    '/Users/jasonkao/Development/redlining-heat/data/**/*.{tif,topojson,osm,json,geojson}*',
    '/Users/jasonkao/Development/redlining-heat/.git/**/*',
    '/Users/jasonkao/Development/redlining-heat/r/*',
    '/Users/jasonkao/Development/redlining-heat/data/scripts/*',
    '/Users/jasonkao/Development/redlining-heat/data/holc-shapefile/*',
    '/Users/jasonkao/Development/redlining-heat/data/Makefile',
    '/Users/jasonkao/Development/redlining-heat/LICENSE',
    '/Users/jasonkao/Development/redlining-heat/src/partials/*.html',
  ],
  buildOptions: {
    metaUrlPath: 'underscore_snowpack'
  },
  devOptions: {
    port: 5000
  },
};
