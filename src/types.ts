import type { JWTVerifyGetKey } from "jose";

export type Bindings = {
  DB: D1Database;
  AUTH_MODE?: string;
  DEV_USER_EMAIL?: string;
  TEAM_DOMAIN?: string;
  POLICY_AUD?: string;
  ALLOWED_EMAIL_DOMAIN?: string;
};

export type Variables = {
  user: string;
};

export type AppEnv = { Bindings: Bindings; Variables: Variables };

export type AppDeps = {
  /** 現在時刻。テストでは進められる時計を注入する */
  now: () => Date;
  /** JWT 検証用の鍵セット。未指定時は TEAM_DOMAIN からリモート取得する */
  jwks?: JWTVerifyGetKey;
};
