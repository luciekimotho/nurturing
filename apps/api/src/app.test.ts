import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "./app";
import { DB_UNAVAILABLE_ERROR } from "./lib/prisma";

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

test("GET /health returns ok payload", async () => {
  const res = await request(app).get("/health");

  assert.equal(res.status, 200);
  assert.equal(res.body.status, "ok");
  assert.equal(res.body.app, "nurturing-api");
  assert.ok(typeof res.body.timestamp === "string");
});

test("GET /api/cycle/phase returns 404 when no cycle data", async () => {
  const res = await request(app).get("/api/cycle/phase");

  if (!hasDatabaseUrl) {
    assert.equal(res.status, 503);
    assert.equal(res.body.error, DB_UNAVAILABLE_ERROR.error);
    return;
  }

  assert.equal(res.status, 404);
  assert.equal(res.body.error, "No cycle data logged yet");
});

test("POST /api/cycle then GET /api/cycle/phase returns phase and guidance", async () => {
  if (!hasDatabaseUrl) {
    const createRes = await request(app)
      .post("/api/cycle")
      .send({ periodStart: new Date().toISOString(), cycleLength: 28 });

    assert.equal(createRes.status, 503);
    assert.equal(createRes.body.error, DB_UNAVAILABLE_ERROR.error);
    return;
  }

  const periodStart = new Date().toISOString();

  const createRes = await request(app)
    .post("/api/cycle")
    .send({ periodStart, cycleLength: 28 });

  assert.equal(createRes.status, 201);
  assert.equal(typeof createRes.body.id, "string");

  const phaseRes = await request(app).get("/api/cycle/phase");

  assert.equal(phaseRes.status, 200);
  assert.ok(["menstrual", "follicular", "ovulatory", "luteal"].includes(phaseRes.body.phase));
  assert.ok(Array.isArray(phaseRes.body.guidance.foodFocus));
  assert.ok(Array.isArray(phaseRes.body.guidance.workoutFocus));
});
