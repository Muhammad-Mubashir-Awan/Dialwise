import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { FullConfig } from "@playwright/test";
import { E2E_OWNER_EMAIL, E2E_STRANGER_EMAIL, OWNER_STATE, STRANGER_STATE, sessionState } from "./auth";

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL!;
  await mkdir(dirname(OWNER_STATE), { recursive: true });
  await writeFile(OWNER_STATE, JSON.stringify(await sessionState(E2E_OWNER_EMAIL, baseURL)));
  await writeFile(STRANGER_STATE, JSON.stringify(await sessionState(E2E_STRANGER_EMAIL, baseURL)));
}
