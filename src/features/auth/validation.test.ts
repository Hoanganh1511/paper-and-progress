import { focusField, getFormString, isValidEmail } from "./validation";

describe("isValidEmail", () => {
  it("accepts addresses shaped like name@domain.tld", () => {
    expect(isValidEmail("ann@example.com")).toBe(true);
    expect(isValidEmail("  ann.b+tag@mail.example.co  ")).toBe(true);
  });

  it("rejects everything else", () => {
    [
      "",
      "ann",
      "ann@",
      "@example.com",
      "ann@example",
      "a nn@example.com",
    ].forEach((value) => expect(isValidEmail(value)).toBe(false));
  });
});

describe("getFormString", () => {
  it("returns strings and falls back to an empty string", () => {
    const formData = new FormData();
    formData.set("name", "Ann");
    formData.set("file", new File([""], "a.txt"));
    expect(getFormString(formData, "name")).toBe("Ann");
    expect(getFormString(formData, "file")).toBe("");
    expect(getFormString(formData, "missing")).toBe("");
  });
});

describe("focusField", () => {
  it("focuses the named control", () => {
    const form = document.createElement("form");
    const input = document.createElement("input");
    input.name = "email";
    form.append(input);
    document.body.append(form);
    focusField(form, "email");
    expect(document.activeElement).toBe(input);
    form.remove();
  });
});
