module.exports = {
  mount: { src: '/', data: '/'},
  plugins: ['snowpack-plugin-posthtml', '@snowpack/plugin-sass'],
  exclude: [
    '/Users/jasonkao/Development/redlining-heat/data/**/*.{tif,topojson,osm,json}',
  ],
};
