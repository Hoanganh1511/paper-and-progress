import { AuthApiError } from "./authApi";
import { AUTH_ERROR_MESSAGES, describeAuthError } from "./messages";

describe("describeAuthError", () => {
  it("shows the backend sentence when it rejected the input and said why", () => {
    const error = new AuthApiError(
      "validation",
      400,
      {},
      undefined,
      "Mật khẩu phải có chữ hoa, chữ thường và số",
    );
    expect(describeAuthError(error)).toBe(
      "Mật khẩu phải có chữ hoa, chữ thường và số",
    );
  });

  it("falls back to a fixed text when a validation error carries no message", () => {
    expect(describeAuthError(new AuthApiError("validation", 400))).toBe(
      AUTH_ERROR_MESSAGES.validation,
    );
  });

  it("never shows the backend text for other failures, e.g. a server error", () => {
    const error = new AuthApiError(
      "unknown",
      500,
      {},
      undefined,
      "PrismaClientKnownRequestError: Unique constraint failed",
    );
    expect(describeAuthError(error)).toBe(AUTH_ERROR_MESSAGES.unknown);
  });

  it("uses the fixed text of the code for known failures", () => {
    expect(
      describeAuthError(new AuthApiError("invalid_credentials", 401)),
    ).toBe(AUTH_ERROR_MESSAGES.invalid_credentials);
  });

  it("treats a value that is not an AuthApiError as unknown", () => {
    expect(describeAuthError(new Error("boom"))).toBe(
      AUTH_ERROR_MESSAGES.unknown,
    );
  });
});
