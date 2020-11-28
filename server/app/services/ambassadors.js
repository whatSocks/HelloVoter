import {v4 as uuidv4} from 'uuid'
import stringFormat from 'string-format'
import neode from '../lib/neode'
import {validateEmpty, validateUnique, assertUserPhoneAndEmail} from '../lib/validations'
import {ValidationError} from '../lib/errors'
import {trimFields} from '../lib/utils'
import {getValidCoordinates, normalizePhone} from '../lib/normalizers'
import mail from '../lib/mail'
import {ov_config} from '../lib/ov_config'
import {signupEmail} from '../emails/signupEmail'

/*
 *
 * findByExternalId(externalId)
 *
 * Simply returns the neode object that corresponds to the given external ID (from Facebook / Google)
 *
 */
async function findByExternalId(externalId) {
  return await neode.first('Ambassador', 'external_id', externalId)
}

/*
 *
 * findById(id)
 *
 * Simply returns the neode object that corresponds to the given ID
 *
 */
async function findById(id) {
  return await neode.first('Ambassador', 'id', id)
}

/*
 *
 * signup(json, verification, carrierLookup)
 *
 * This is the main service function for Ambassador signup.
 *
 * It validates a variety of data and if all is valid, creates the neode Ambassador object.
 *   If the given Ambassador was once a Tripler, a :WAS_ONCE relationship is created between them
 *
 * This function then sends an admin email informing admins of the ambassador creation.
 *
 */
async function signup(json, verification, carrierLookup) {
  json = trimFields(json)

  if (!validateEmpty(json, ['first_name', 'phone', 'address'])) {
    throw new ValidationError('Invalid payload, ambassador cannot be created')
  }

  await assertUserPhoneAndEmail('Ambassador', json.phone, json.email)

  if (!(await validateUnique('Ambassador', {external_id: json.externalId}))) {
    throw new ValidationError(
      'If you have already signed up as an Ambassador using Facebook or Google, you cannot sign up again.',
    )
  }

  const [coordinates, address] = await getValidCoordinates(json.address)

  let new_ambassador = await neode.create('Ambassador', {
    id: uuidv4(),
    first_name: json.first_name,
    last_name: json.last_name || null,
    phone: normalizePhone(json.phone),
    email: json.email || null,
    date_of_birth: json.date_of_birth || null,
    address: JSON.stringify(address, null, 2),
    quiz_results: JSON.stringify(json.quiz_results, null, 2) || null,
    approved: true,
    locked: false,
    signup_completed: true,
    onboarding_completed: true,
    location: {
      latitude: parseFloat(coordinates.latitude),
      longitude: parseFloat(coordinates.longitude),
    },
    external_id: ov_config.stress ? json.externalId + Math.random() : json.externalId,
    verification: JSON.stringify(verification, null, 2),
    carrier_info: JSON.stringify(carrierLookup, null, 2),
  })

  let existing_tripler = await neode.first('Tripler', {
    phone: normalizePhone(json.phone),
  })

  if (existing_tripler) {
    new_ambassador.relateTo(existing_tripler, 'was_once')
  }

  // send email in the background
  setTimeout(async () => {
    let address = JSON.parse(new_ambassador.get('address'))
    let body = signupEmail(new_ambassador, address)
    let subject = stringFormat(ov_config.new_ambassador_signup_admin_email_subject, {
      organization_name: ov_config.organization_name,
    })
    await mail(ov_config.admin_emails, null, null, subject, body)
  }, 100)

  return new_ambassador
}

/*
 *
 * getPrimaryAccount(ambassador)
 *
 * This function returns the primary Account node for a given Ambassador
 *
 * NOTE: there was originally no is_primary attribute on Ambassador nodes.
 *   The update that added this attribute did not do so via a migration.
 *   Therefore in the database, there existed (exists) legacy nodes without
 *   this attribute. This function checks if none of the Account nodes are
 *   is_primary:true and if none exist, it sets the first one to be primary.
 *
 */
async function getPrimaryAccount(ambassador) {
  let relationships = ambassador.get('owns_account')
  let primaryAccount = null

  if (relationships.length > 0) {
    relationships.forEach((ownsAccount) => {
      if (ownsAccount.otherNode().get('is_primary')) {
        primaryAccount = ownsAccount.otherNode()
      }
    })

    if (!primaryAccount) {
      // probably a legacy account
      relationships.forEach(async (ownsAccount) => {
        if (primaryAccount) return
        await ownsAccount.otherNode().update({is_primary: true})
        primaryAccount = ownsAccount.otherNode()
      })
    }
  }

  return primaryAccount
}

/*
 *
 * unclaimTriplers(req)
 *
 * This function simply removes the :CLAIMS relationship between the current
 *   Ambassador and the given Tripler.
 *
 */
async function unclaimTriplers(req) {
  let ambassador = req.user

  for (var x = 0; x < req.body.triplers.length; x++) {
    let result = await req.neode
      .query()
      .match('a', 'Ambassador')
      .where('a.id', ambassador.get('id'))
      .relationship('CLAIMS', 'out', 'r')
      .to('t', 'Tripler')
      .where('t.id', req.body.triplers[x])
      .detachDelete('r')
      .execute()
  }
}

/*
 *
 * socialMatchTripler(req)
 *
 * This function allows an Ambassador to create a SocialMatch between themselves and a single tripler
 *
 */
async function socialMatchTripler(req) {
  let ambassador = req.user
  let query = `MATCH (a:Ambassador {id:$a_id}), (t:Tripler {id:$t_id})
      MERGE (a)-[:HAS_SOCIAL_MATCH]->(s:SocialMatch)-[:HAS_SOCIAL_MATCH]->(t)
      SET s.similarity_metric=$similarity_metric`
  let params = {
    a_id: ambassador.get('id'),
    t_id: req.body.tripler,
    similarity_metric: req.body.similarity_metric,
  }

  let result = await req.neode.cypher(query, params)
}

module.exports = {
  findByExternalId: findByExternalId,
  findById: findById,
  signup: signup,
  getPrimaryAccount: getPrimaryAccount,
  unclaimTriplers: unclaimTriplers,
  socialMatchTripler: socialMatchTripler,
}
