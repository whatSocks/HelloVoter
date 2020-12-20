/*
 *
 * This model corresponds to the EkataPerson neo4j nodes
 * All data comes from Ekata
 */

module.exports = {
  // This is the Ekata Person id, it comes from Ekata
  id: {
    type: "string",
    primary: true,
  },
  first_name: {
    type: "string",
  },
  last_name: {
    type: "string",
  },
}
