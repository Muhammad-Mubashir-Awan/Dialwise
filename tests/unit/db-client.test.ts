import { describe, expect, it } from "vitest";
import { withExplicitSsl } from "@/lib/db/client";

describe("withExplicitSsl", () => {
  it("turns require, prefer and verify-ca into verify-full, keeping the rest of the address", () => {
    const base = "postgresql://u:p@ep-x-pooler.ap-southeast-1.aws.neon.tech/neondb";
    expect(withExplicitSsl(`${base}?sslmode=require&channel_binding=require`)).toBe(
      `${base}?sslmode=verify-full&channel_binding=require`,
    );
    expect(withExplicitSsl(`${base}?channel_binding=require&sslmode=prefer`)).toBe(
      `${base}?channel_binding=require&sslmode=verify-full`,
    );
    expect(withExplicitSsl(`${base}?sslmode=verify-ca`)).toBe(`${base}?sslmode=verify-full`);
  });

  it("leaves other addresses alone", () => {
    expect(withExplicitSsl("postgresql://postgres@127.0.0.1:54329/postgres")).toBe(
      "postgresql://postgres@127.0.0.1:54329/postgres",
    );
    expect(withExplicitSsl("postgresql://u@h/db?sslmode=verify-full")).toBe("postgresql://u@h/db?sslmode=verify-full");
    expect(withExplicitSsl("postgresql://u@h/db?sslmode=disable")).toBe("postgresql://u@h/db?sslmode=disable");
  });
});
