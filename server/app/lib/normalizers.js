import neo4j from 'neo4j-driver';
import PhoneNumber from 'awesome-phonenumber';
import { geoCode, zipToLatLon } from './utils';
import { validateState } from './validations';
import { ValidationError } from './errors';

const WGS_84_2D = 4326;

const ALLOWED_ATTRS = ['first_name', 'last_name', 'date_of_birth', 'email', 'status', 'quiz_completed', 'onboarding_completed'];

/*
 *
 * normalizeGender(gender)
 *
 * This function converts the gender string as passed by the frontend into the single character that the db tracks in neo4j.
 *
 */
export function normalizeGender(gender) {
  return (gender || "U").trim().replace(/Female/i, "F").replace(/Male/i, "M");
}

export function normalizeAddress(address) {
  return {
    ...address,
    state: (address?.state || '').toUpperCase(),
    zip: ((address?.zip || '') + '').replace(/ /g, ''),
  };
}

/*
 *
 * internationalNumber(phone)
 *
 * This function simply formats a given phone argument into a standardized string.
 *
 */
export function internationalNumber(phone) {
  return (new PhoneNumber(phone, 'US')).getNumber('international');
}

/*
 *
 * normalizePhone(phone)
 *
 * This function simply strips given phone arguments of thier non-numeric and non-extention related characters
 *
 */
export function normalizePhone(phone) {
  return internationalNumber(phone).replace(/[^0-9xX]/g, '')
}

/** Specifically for cypher matching. */
export function normalizeName(name) {
  return (name || "").trim().replace(/-'/g, "").toLowerCase()
}

/*
 *
 * getValidCoordinates(address)
 *
 * This function either determines an address's latitude and longitude by way of the geoCode function (census.gov),
 *   or determines the latitude and longitude of the given zip code by way of the zipToLatLon function.
 * This function gets called when an Ambassador signs up with the system.
 *
 */
export async function getValidCoordinates(address) {
  const addressNorm = normalizeAddress(address);

  if (!validateState(addressNorm.state)) {
    throw new ValidationError("Sorry, but state employment laws don't allow us to pay Voting Ambassadors in your state.");
  }

  let coordinates = await geoCode(addressNorm);
  if (!coordinates) {
    coordinates = await zipToLatLon(addressNorm.zip);
  }
  if (!coordinates) {
    throw new ValidationError("Our system doesn't recognize that zip code. Please try again.");
  }

  addressNorm.location = { latitude: coordinates.latitude, longitude: coordinates.longitude };

  return [coordinates, addressNorm];
}

/** This can handle both Ambassadors and Triplers. */
export async function getUserJsonFromRequest(body) {
  const json = {};

  for (const prop in body) {
    if (ALLOWED_ATTRS.indexOf(prop) >= 0) {
      json[prop] = body[prop];
    }
  }

  if (body.phone) {
    json.phone = normalizePhone(body.phone);
  }

  if (body.address) {
    const [coordinates, address] = await getValidCoordinates(body.address);
    json.address = JSON.stringify(address, null, 2);
    json.location = new neo4j.types.Point(
      WGS_84_2D,
      coordinates.longitude,
      coordinates.latitude,
    );
  }

  if (body.quiz_results) {
    json.quiz_results = JSON.stringify(body.quiz_results, null, 2);
  }

  if (body.triplees) {
    json.triplees = JSON.stringify(body.triplees, null, 2);
  }

  return json;
}
