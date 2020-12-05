/*
 *
 * This model corresponds to the SocialMatch nodes
 *
 */
module.exports = {
  id: {
    type: "uuid",
    primary: true,
  },
  similarity_metric: {
    type: "float",
    default: 0,
  },
  has_social_match_to: {
    type: "relationship",
    relationship: "HAS_SOCIAL_MATCH",
    direction: "out",
    eager: true,
  },
  has_social_match_from: {
    type: "relationship",
    relationship: "HAS_SOCIAL_MATCH",
    direction: "in",
    eager: true,
  },
}
