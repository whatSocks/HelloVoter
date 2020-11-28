/*
 *
 * This model corresponds to the Tripler neo4j nodes
 *
 */
module.exports = {
  // This is the BlockPower internal ID
  id: {
    type: 'uuid',
    primary: true,
  },
  // This attribute contains the VoterID as imported from the voter data CSV
  voter_id: {
    type: 'string',
  },
  first_name: {
    type: 'string',
    required: true,
  },
  last_name: 'string',
  date_of_birth: 'string',
  phone: {
    type: 'string',
  },
  email: 'string',
  // This indicates what status the Tripler is in. When claimed, Triplers have a status of
  //   'unconfirmed'. When the Ambassador begins the confirmation process, they have a status
  //   of 'pending'. When the Tripler confirms, they have a status of 'confirmed'
  status: 'string',
  // The date of confirmation
  confirmed_at: 'localdatetime',
  // This indicates whether or not this Tripler has received an SMS encouraging them to upgrade
  //   and become an Ambassador themselves. This SMS is sent after a Tripler confirms, and is
  //   sent on a schedule as determined by the appropriate .env vars and /backgrounds/upgrade_sms.js
  upgrade_sms_sent: {
    type: 'boolean',
    default: false,
  },
  address: {
    type: 'string',
    required: true,
  },
  // This is the lat/lon data as imported from the voter data CSV
  location: {
    type: 'point',
    required: true,
  },
  // This is the stringified JSON object sent by the Ambassador when initiating the Tripler
  //   confirmation process.
  triplees: 'string',
  created_at: {
    type: 'localdatetime',
    default: () => new Date(),
  },
  // This simply points back to the Ambassador that has a "claims" relationship with this Tripler
  claimed: {
    type: 'node',
    target: 'Ambassador',
    relationship: 'CLAIMS',
    direction: 'in',
    eager: true,
    cascade: 'detach',
  },
  // This simply points back to the Ambassador that this Tripler now is
  is_ambassador: {
    type: 'node',
    target: 'Ambassador',
    relationship: 'WAS_ONCE',
    eager: true,
    cascade: 'detach',
  },
  // This indicates that the Tripler is now an Ambassador, and that Ambassador
  //   has already confirmed at least 1 Tripler themselves.
  is_ambassador_and_has_confirmed: {
    type: 'boolean',
    default: false,
  },
  // This holds the stringified JSON as returned by Twilio and Ekata's caller ID lookup service
  verification: 'string',
  // This holds the stringified JSON as returned by Twiilo, providing information on the Tripler's
  //   phone carrier, but only if this carrier is not blocked.
  carrier_info: 'string',
  // This holds the stringified JSON as returned by Twiilo, providing information on the Tripler's
  //   phone carrier, but only if this carrier is blocked.
  blocked_carrier_info: 'string',
  gender: 'string',
  full_name: 'string',
  // This is imported from the voter data CSV, in the form of "20-29", "40-49", and so on.
  age_decade: 'string',
  // This is imported from the voter data CSV, and indicates the metro area they live in
  //   for example, 'GA Atlanta' would indicate this Tripler lives in the Atlanta metro region
  msa: 'string',
  birthdate_mm_yy: 'string',
  zip: 'string',

  // Relationships
  has_social_match_to: {
    type: 'relationships',
    relationship: 'HAS_SOCIAL_MATCH',
    direction: 'out',
    target: 'SocialMatch',
    eager: true,
  },
}
