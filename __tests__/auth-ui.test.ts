import {
  friendlyLoginAuthError,
  isLoginFormSubmittable,
} from "@/app/login/page";
import {
  friendlySignupAuthError,
  isSignupFormSubmittable,
} from "@/app/signup/page";

describe("Auth UI helpers", () => {
  describe("login helpers", () => {
    it("validates login form input", () => {
      expect(isLoginFormSubmittable("student@example.com", "secret1")).toBe(true);
      expect(isLoginFormSubmittable("  student@example.com  ", "secret1")).toBe(true);
      expect(isLoginFormSubmittable("", "secret1")).toBe(false);
      expect(isLoginFormSubmittable("student@example.com", "123")).toBe(false);
    });

    it("maps login auth error codes", () => {
      expect(friendlyLoginAuthError("auth/invalid-email")).toContain("valid email");
      expect(friendlyLoginAuthError("auth/invalid-credential")).toContain("Incorrect");
      expect(friendlyLoginAuthError("auth/user-not-found")).toContain("Incorrect");
      expect(friendlyLoginAuthError("auth/wrong-password")).toContain("Incorrect");
      expect(friendlyLoginAuthError("auth/too-many-requests")).toContain("Too many attempts");
      expect(friendlyLoginAuthError("unknown-code")).toContain("Login failed");
    });
  });

  describe("signup helpers", () => {
    it("validates signup form input", () => {
      expect(isSignupFormSubmittable("Asha", "asha@example.com", "secret1")).toBe(true);
      expect(isSignupFormSubmittable("A", "asha@example.com", "secret1")).toBe(false);
      expect(isSignupFormSubmittable("Asha", "", "secret1")).toBe(false);
      expect(isSignupFormSubmittable("Asha", "asha@example.com", "123")).toBe(false);
    });

    it("maps signup auth error codes", () => {
      expect(friendlySignupAuthError("auth/invalid-email")).toContain("valid email");
      expect(friendlySignupAuthError("auth/email-already-in-use")).toContain("already exists");
      expect(friendlySignupAuthError("auth/weak-password")).toContain("at least 6");
      expect(friendlySignupAuthError("auth/too-many-requests")).toContain("Too many attempts");
      expect(friendlySignupAuthError("unknown-code")).toContain("Sign up failed");
    });
  });
});
