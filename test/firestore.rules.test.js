import { readFileSync } from "node:fs";
import { before, after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";

const projectId = "demo-tempoya-rules";
let env;
before(async () => {
  env = await initializeTestEnvironment({
    projectId,
    firestore: { rules: readFileSync("firestore.rules", "utf8") }
  });
});
after(async () => { await env.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, "matches/alice_bob"), { members: ["alice", "bob"], names: {alice:"Alice",bob:"Bob"} });
    await setDoc(doc(db, "likes/alice_bob"), {from:"alice",to:"bob"});
    await setDoc(doc(db, "likes/bob_alice"), {from:"bob",to:"alice"});
    await setDoc(doc(db, "bookings/booking-1"), {
      members:["alice","bob"], requesterId:"alice", matchId:"alice_bob",
      venue:"Public cafe", meetingTime:new Date(Date.now()+86400000),
      durationMinutes:30, status:"requested", paymentStatus:"not_enabled"
    });
  });
});

test("match and chat are readable before a block", async () => {
  const db = env.authenticatedContext("alice").firestore();
  await assertSucceeds(getDoc(doc(db, "matches/alice_bob")));
  await assertSucceeds(getDoc(doc(db, "matches/alice_bob/messages/message-1")));
});

test("block document ID must match the blocker and blocked user", async () => {
  const db = env.authenticatedContext("alice").firestore();
  await assertFails(setDoc(doc(db, "blocks/wrong-id"), {by:"alice",blocked:"bob",createdAt:new Date()}));
});

test("a block prevents reading match, chat and booking", async () => {
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), "blocks/alice_bob"), {by:"alice",blocked:"bob",createdAt:new Date()});
  });
  const db = env.authenticatedContext("bob").firestore();
  await assertFails(getDoc(doc(db, "matches/alice_bob")));
  await assertFails(getDoc(doc(db, "matches/alice_bob/messages/message-1")));
  await assertFails(getDoc(doc(db, "bookings/booking-1")));
});

test("a block prevents creating a new match", async () => {
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), "blocks/bob_alice"), {by:"bob",blocked:"alice",createdAt:new Date()});
  });
  const db = env.authenticatedContext("alice").firestore();
  await assertFails(setDoc(doc(db, "matches/alice_bob"), {members:["alice","bob"]}));
});
