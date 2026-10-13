import { describe, expect, it } from "vitest";
import { setup } from "../helpers";

describe("/_styleguide", () => {
  it("AUTH_MODE が dev 以外のとき 404", async () => {
    const res = await setup().as("alice@example.com").get("/_styleguide");
    expect(res.status).toBe(404);
  });

  it("AUTH_MODE=dev のとき 200", async () => {
    const s = setup({ env: { AUTH_MODE: "dev", DEV_USER_EMAIL: "alice@example.com" } });
    const res = await s.request("/_styleguide");
    expect(res.status).toBe(200);
  });
});
