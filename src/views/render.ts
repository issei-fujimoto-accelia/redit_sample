import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { Child } from "hono/jsx";

/** JSX を DOCTYPE 付きの HTML レスポンスにする */
export async function render(c: Context, node: Child, status: ContentfulStatusCode = 200) {
  return c.html(`<!DOCTYPE html>${await node}`, status);
}
