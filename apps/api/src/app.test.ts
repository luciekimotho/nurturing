import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "./app";
import { DB_UNAVAILABLE_ERROR } from "./lib/prisma";
import { MISSING_USER_ID_ERROR } from "./middleware/requireUser";

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

test("GET /health returns ok payload", async () => {
  const res = await request(app).get("/health");

  assert.equal(res.status, 200);
  assert.equal(res.body.status, "ok");
  assert.equal(res.body.app, "nurturing-api");
  assert.ok(typeof res.body.timestamp === "string");
});

test("GET /api/cycle/phase returns 404 when no cycle data", async () => {
  const authHeaders = { "x-user-id": "test-empty-cycle-user" };
  const res = await request(app).get("/api/cycle/phase").set(authHeaders);

  if (!hasDatabaseUrl) {
    assert.equal(res.status, 503);
    assert.equal(res.body.error, DB_UNAVAILABLE_ERROR.error);
    return;
  }

  assert.equal(res.status, 404);
  assert.equal(res.body.error, "No cycle data logged yet");
});

test("POST /api/cycle then GET /api/cycle/phase returns phase and guidance", async () => {
  const authHeaders = { "x-user-id": "test-cycle-phase-user" };

  if (!hasDatabaseUrl) {
    const createRes = await request(app)
      .post("/api/cycle")
      .set(authHeaders)
      .send({ periodStart: new Date().toISOString(), cycleLength: 28 });

    assert.equal(createRes.status, 503);
    assert.equal(createRes.body.error, DB_UNAVAILABLE_ERROR.error);
    return;
  }

  const periodStart = new Date().toISOString();

  const createRes = await request(app)
    .post("/api/cycle")
    .set(authHeaders)
    .send({ periodStart, cycleLength: 28 });

  assert.equal(createRes.status, 201);
  assert.equal(typeof createRes.body.id, "string");

  const phaseRes = await request(app).get("/api/cycle/phase").set(authHeaders);

  assert.equal(phaseRes.status, 200);
  assert.ok(["menstrual", "follicular", "ovulatory", "luteal"].includes(phaseRes.body.phase));
  assert.ok(Array.isArray(phaseRes.body.guidance.foodFocus));
  assert.ok(Array.isArray(phaseRes.body.guidance.workoutFocus));
});

test("PATCH /api/cycle/:id updates an existing cycle log", async () => {
  const authHeaders = { "x-user-id": "test-cycle-update-user" };

  const createRes = await request(app)
    .post("/api/cycle")
    .set(authHeaders)
    .send({ periodStart: new Date("2026-05-01T00:00:00.000Z").toISOString() });

  if (!hasDatabaseUrl) {
    assert.equal(createRes.status, 503);
    assert.equal(createRes.body.error, DB_UNAVAILABLE_ERROR.error);
    return;
  }

  assert.equal(createRes.status, 201);

  const patchRes = await request(app)
    .patch(`/api/cycle/${createRes.body.id}`)
    .set(authHeaders)
    .send({
      periodStart: new Date("2026-05-02T00:00:00.000Z").toISOString(),
      periodEnd: new Date("2026-05-06T00:00:00.000Z").toISOString(),
    });

  assert.equal(patchRes.status, 200);
  assert.equal(typeof patchRes.body.id, "string");
  assert.ok(patchRes.body.periodStart.startsWith("2026-05-02"));
  assert.ok(patchRes.body.periodEnd.startsWith("2026-05-06"));
});

test("DELETE /api/cycle/:id removes an existing cycle log", async () => {
  const authHeaders = { "x-user-id": "test-cycle-delete-user" };

  const createRes = await request(app)
    .post("/api/cycle")
    .set(authHeaders)
    .send({ periodStart: new Date("2026-05-03T00:00:00.000Z").toISOString() });

  if (!hasDatabaseUrl) {
    assert.equal(createRes.status, 503);
    assert.equal(createRes.body.error, DB_UNAVAILABLE_ERROR.error);
    return;
  }

  assert.equal(createRes.status, 201);

  const deleteRes = await request(app)
    .delete(`/api/cycle/${createRes.body.id}`)
    .set(authHeaders);

  assert.equal(deleteRes.status, 204);

  const listRes = await request(app).get("/api/cycle").set(authHeaders);
  assert.equal(listRes.status, 200);
  assert.equal(Array.isArray(listRes.body), true);
  assert.equal(listRes.body.some((log: { id: string }) => log.id === createRes.body.id), false);
});

test("GET /api/cycle/phase rejects missing user header", async () => {
  const res = await request(app).get("/api/cycle/phase");

  assert.equal(res.status, 401);
  assert.equal(res.body.error, MISSING_USER_ID_ERROR.error);
});

test("POST /api/workouts saves when notes are omitted", async () => {
  const authHeaders = { "x-user-id": "test-workout-no-notes-user" };

  const createRes = await request(app)
    .post("/api/workouts")
    .set(authHeaders)
    .send({
      type: "Walk",
      durationMinutes: 30,
      intensityLevel: "low",
      loggedAt: new Date().toISOString(),
    });

  if (!hasDatabaseUrl) {
    assert.equal(createRes.status, 503);
    assert.equal(createRes.body.error, DB_UNAVAILABLE_ERROR.error);
    return;
  }

  assert.equal(createRes.status, 201);
  assert.equal(createRes.body.type, "Walk");
  assert.equal(createRes.body.durationMinutes, 30);
});

test("GET /api/food/suggestions validates minimum query length", async () => {
  const authHeaders = { "x-user-id": "test-food-suggestions-min-query" };
  const res = await request(app).get("/api/food/suggestions?q=a").set(authHeaders);

  if (!hasDatabaseUrl) {
    assert.equal(res.status, 503);
    assert.equal(res.body.error, DB_UNAVAILABLE_ERROR.error);
    return;
  }

  assert.equal(res.status, 400);
  assert.equal(res.body.error, "Query must be at least 2 characters");
});

test("GET /api/food/suggestions supports limit and prefix-first ordering", async () => {
  const authHeaders = { "x-user-id": "test-food-suggestions-order" };
  const res = await request(app).get("/api/food/suggestions?q=chi&limit=2").set(authHeaders);

  if (!hasDatabaseUrl) {
    assert.equal(res.status, 503);
    assert.equal(res.body.error, DB_UNAVAILABLE_ERROR.error);
    return;
  }

  assert.equal(res.status, 200);
  assert.equal(Array.isArray(res.body), true);
  assert.equal(res.body.length <= 2, true);
  assert.equal(res.body.length > 0, true);
  assert.equal(String(res.body[0].label).toLowerCase().startsWith("chi"), true);
});

test("GET /api/workouts/suggestions returns empty list when no match", async () => {
  const authHeaders = { "x-user-id": "test-workout-suggestions-empty" };
  const res = await request(app).get("/api/workouts/suggestions?q=zzzxq").set(authHeaders);

  if (!hasDatabaseUrl) {
    assert.equal(res.status, 503);
    assert.equal(res.body.error, DB_UNAVAILABLE_ERROR.error);
    return;
  }

  assert.equal(res.status, 200);
  assert.deepEqual(res.body, []);
});
