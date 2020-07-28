function serializeAddress(address) {
  if (!address) return '';
  let keys = [ 'address1', 'city', 'state', 'zip' ];
  let values = [];
  keys.forEach((key)=>{if (address[key]) values.push(address[key])});
  return values.join(", ");
}

function serializeName(first_name, last_name) {
  if (!last_name) return first_name;
  return [first_name, last_name].join(" ");
}

function serializeAccount(account) {
  let obj = {};
  ['id', 'account_id', 'account_type'].forEach(x => obj[x] = account.get(x));
  obj['account_data'] = !!account.get('account_data') ? JSON.parse(account.get('account_data')) : null;
  return obj;
}

function serializeAmbassador(ambassador) {
  let obj = {};
  ['id', 'external_id', 'first_name', 'last_name', 'phone', 'email', 'location', 'signup_completed', 'onboarding_completed', 'approved', 'locked', 'payout_provider', 'payout_additional_data'].forEach(x => obj[x] = ambassador.get(x));
  obj['address'] = !!ambassador.get('address') ? JSON.parse(ambassador.get('address')) : null;
  obj['display_address'] = !!obj['address'] ? serializeAddress(obj['address']) : null;
  obj['display_name'] = serializeName(ambassador.get('first_name'), ambassador.get('last_name'));
  obj['quiz_results'] = !!ambassador.get('quiz_results') ? JSON.parse(ambassador.get('quiz_results')) : null;

  let account = ambassador.get('owns_account').first();
  obj['account'] = !!account ? serializeAccount(account.otherNode()) : null;
  return obj;
}

function serializePayout(payout) {
  return {
    amount: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(payout.get('amount').low/100),
    status: payout.get('status'),
    disbursement_id: payout.get('disbursement_id'),
    settlement_id: payout.get('settlement_id'),
    disbursed_at: payout.get('disbursed_at') ? new Date(payout.get('disbursed_at').toString()) : null,
    settled_at: payout.get('settled_at') ? new Date(payout.get('settled_at').toString()) : null,
    error: payout.get('error') ? JSON.parse(payout.get('error')) : null
  };
}

function serializeTripler(tripler) {
  let obj = {};
  ['id', 'first_name', 'last_name', 'status', 'phone', 'location', 'email'].forEach(x => obj[x] = tripler.get(x));
  obj['address'] = !!tripler.get('address') ? JSON.parse(tripler.get('address')) : null;
  obj['display_address'] = !!obj['address'] ? serializeAddress(obj['address']) : null;
  obj['display_name'] = serializeName(tripler.get('first_name'), tripler.get('last_name'));
  obj['triplees'] = !!tripler.get('triplees') ? JSON.parse(tripler.get('triplees')) : null;
  return obj;
}

function serializeNeo4JTripler(tripler) {
  let obj = {};
  ['id', 'first_name', 'last_name', 'status', 'phone', 'location', 'email'].forEach(x => obj[x] = tripler[x]);
  obj['address'] = !!tripler.address ? JSON.parse(tripler.address) : null;
  obj['display_address'] = !!obj['address'] ? serializeAddress(obj['address']) : null;
  obj['display_name'] = serializeName(tripler.first_name, tripler.last_name);
  obj['triplees'] = !!tripler.triplees ? JSON.parse(tripler.triplees) : null;
  return obj;
}

module.exports = {
  serializeAmbassador: serializeAmbassador,
  serializeTripler: serializeTripler,
  serializeNeo4JTripler: serializeNeo4JTripler,
  serializePayout: serializePayout,
  serializeAccount: serializeAccount,
  serializeName: serializeName,
  serializeAddress: serializeAddress
};
