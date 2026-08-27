/**
 * Last line of defence for "leave the database as you found it": deletes
 * anything still carrying the test marker, including rows a crashed suite never
 * got to clean up itself.
 */
const { sweepTestArtifacts } = require("./test-utils/edge/fixtures");

module.exports = async () => {
  await sweepTestArtifacts();
};
