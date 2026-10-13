import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

export default defineConfig(async () => {
  const migrations = await readD1Migrations("./migrations");

  return {
    plugins: [
      cloudflareTest({
        wrangler: { configPath: "./wrangler.jsonc" },
        miniflare: {
          bindings: { TEST_MIGRATIONS: migrations },
        },
      }),
    ],
    test: {
      // Workers ランタイムからは fsModuleCache のファイルを読めないため無効化する
      fsModuleCache: false,
      setupFiles: ["./test/setup/apply-migrations.ts"],
      coverage: {
        provider: "istanbul",
        include: ["src/**"],
        reporter: ["text", "html"],
      },
    },
  };
});
