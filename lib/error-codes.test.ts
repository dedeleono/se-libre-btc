import { describe, expect, it } from "vitest";

import { ERROR_CODES, errorPath, parseErrorCode } from "./error-codes";
import { messages } from "./i18n/messages";

describe("error codes", () => {
  it("accepts a known code", () => {
    expect(parseErrorCode("invitationExpired")).toBe("invitationExpired");
  });

  it("rejects free text, missing values and arrays", () => {
    expect(parseErrorCode("Invalid invitation link")).toBeNull();
    expect(parseErrorCode(undefined)).toBeNull();
    expect(parseErrorCode(["invitationExpired"])).toBeNull();
  });

  it("builds the error page path from a code", () => {
    expect(errorPath("accountBlocked")).toBe("/error?code=accountBlocked");
  });

  it.each(["es", "en"] as const)("has %s copy for every code", (locale) => {
    for (const code of ERROR_CODES) {
      const copy = messages[locale].errors.pages[code];
      expect(copy.title.trim(), `${locale}.${code}.title`).not.toBe("");
      expect(copy.body.trim(), `${locale}.${code}.body`).not.toBe("");
    }
  });
});
