import * as trpc from "@trpc/server";

function createRouter() {
  return trpc.router<Context>();
}
