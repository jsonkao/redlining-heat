// Require client library and private key.
var ee = require('@google/earthengine');
var privateKey = require('./privatekey.json');

// Initialize client library and run analysis.
var runAnalysis = function () {
  ee.initialize(
    null,
    null,
    function () {
      var image = new ee.Image('srtm90_v4');
      image.getMap({ min: 0, max: 1000 }, function (map) {
        console.log(map);
      });
    },
    function (e) {
      console.error('Initialization error: ' + e);
    },
  );
};

// Authenticate using a service account.
ee.data.authenticateViaPrivateKey(privateKey, runAnalysis);
