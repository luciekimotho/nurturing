import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "./app";

test("GET /health returns ok payload", async () => {
  const res = await request(app).get("/health");

  assert.equal(res.status, 200);
  assert.equal(res.body.status, "ok");
  assert.equal(res.body.app, "nurturing-api");
  assert.ok(typeof res.body.timestamp === "string");
});

test("GET /api/cycle/phase returns 404 when no cycle data", async () => {
  const res = await request(app).get("/api/cycle/phase");

  assert.equal(res.status, 404);
  assert.equal(res.body.error, "No cycle data logged yet");
});

test("POST /api/cycle then GET /api/cycle/phase returns phase and guidance", async () => {
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
