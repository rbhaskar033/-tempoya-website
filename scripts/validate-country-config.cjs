// Lightweight, dependency-free checks for TEMPOYA's public country/pricing config.
// Run with: node scripts/validate-country-config.cjs
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("country-currency-config.js", "utf8");
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox, { timeout: 1000 });
const countries = sandbox.window.TEMPOYA_COUNTRIES;
const tiers = sandbox.window.TEMPOYA_TARIFFS;
const errors = [];
if (!Array.isArray(countries) || countries.length !== 22) errors.push(`Expected 22 countries; got ${countries?.length ?? "none"}`);
const codes = new Set();
for (const c of countries || []) {
  for (const key of ["countryCode", "country", "currencyCode", "currencySymbol"]) {
    if (typeof c[key] !== "string" || !c[key].trim()) errors.push(`${c.countryCode || "unknown"}: missing ${key}`);
  }
  if (!Number.isFinite(c.verificationFeeAmount) || c.verificationFeeAmount <= 0) errors.push(`${c.countryCode}: invalid verification fee`);
  if (c.verificationFeeFrequency !== "one-time") errors.push(`${c.countryCode}: verification fee must be one-time`);
  if (codes.has(c.countryCode)) errors.push(`Duplicate country code: ${c.countryCode}`);
  codes.add(c.countryCode);
}
const expectedTiers = ["Basic", "Standard", "Premium"];
for (const tier of expectedTiers) {
  const items = tiers?.[tier];
  if (!Array.isArray(items) || items.length !== 5) {
    errors.push(`${tier}: expected 5 duration prices`);
    continue;
  }
  for (const item of items) {
    if (typeof item.duration !== "string" || !Number.isFinite(item.amount) || item.amount <= 0) {
      errors.push(`${tier}: invalid tariff item`);
    }
  }
}
if (errors.length) {
  console.error("TEMPOYA config validation FAILED:");
  for (const error of errors) console.error("- " + error);
  process.exitCode = 1;
} else {
  console.log("TEMPOYA config validation PASSED: 22 unique country codes, one-time verification fee metadata, and 3 tiers × 5 duration prices.");
  console.log("Note: this validates configuration only; it does not test Firebase, payments, hosting, SOS, or mobile apps.");
}
