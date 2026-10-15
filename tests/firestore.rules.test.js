import { readFile } from "node:fs/promises";
import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";

const projectId = "tempoya-rules-test";
let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId,
    firestore: { rules: await readFile(new URL("../firestore.rules", import.meta.url), "utf8") }
  });
});
beforeEach(async () => env.clearFirestore());
after(async () => env.cleanup());

test("signed-in user can read own user document", async () => {
  await env.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), "users/alice"), {
      displayName: "Alice", age: 30, country: "India", preferredLanguage: "en"
    });
  });
  await assertSucceeds(getDoc(doc(env.authenticatedContext("alice").firestore(), "users/alice")));
});

test("user cannot read another user's private document", async () => {
  await env.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), "users/bob"), {
      displayName: "Bob", age: 31, country: "India", preferredLanguage: "en"
    });
  });
  await assertFails(getDoc(doc(env.authenticatedContext("alice").firestore(), "users/bob")));
});

test("client cannot create or alter server-controlled verification fields", async () => {
  const db = env.authenticatedContext("alice").firestore();
  await assertFails(setDoc(doc(db, "users/alice"), {
    displayName: "Alice", age: 30, country: "India", preferredLanguage: "en",
    verificationFeePaid: true, verificationStatus: "verified"
  }));
});

test("unauthenticated user cannot read private profile", async () => {
  await env.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), "users/alice"), {
      displayName: "Alice", age: 30, country: "India", preferredLanguage: "en"
    });
  });
  await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), "users/alice")));
});
