module.exports = {
  mount: { src: '/', data: '/'},
  plugins: ['snowpack-plugin-posthtml', '@snowpack/plugin-sass'],
  exclude: [
    '/Users/jasonkao/Development/redlining-heat/data/**/*.{tif,topojson,osm,json,geojson}*',
    '/Users/jasonkao/Development/redlining-heat/data/scripts/*',
    '/Users/jasonkao/Development/redlining-heat/data/holc-shapefile/*',
    '/Users/jasonkao/Development/redlining-heat/data/Makefile',
    '/Users/jasonkao/Development/redlining-heat/src/partials/*.html',
  ],
};
