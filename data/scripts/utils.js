const ee = require('@google/earthengine');
const privateKey = require('./privatekey.json');

function run(fn) {
  // Authenticate using a service account and run
  ee.data.authenticateViaPrivateKey(privateKey, function () {
    // Initialize client library and run analysis.
    ee.initialize(null, null, fn, e =>
      console.error('Initialization error: ' + e),
    );
  });
}

module.exports = {
  run,
};
