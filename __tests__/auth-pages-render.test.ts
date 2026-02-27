import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import LoginPage from "@/app/login/page";
import SignupPage from "@/app/signup/page";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/components/auth/AuthProvider", () => ({
  useAuth: jest.fn(),
}));

const useRouterMock = useRouter as jest.MockedFunction<typeof useRouter>;
const useAuthMock = useAuth as jest.MockedFunction<typeof useAuth>;

describe("Auth pages render", () => {
  beforeEach(() => {
    useRouterMock.mockReturnValue({ replace: jest.fn() } as never);
  });

  it("renders login page shell", () => {
    useAuthMock.mockReturnValue({ user: null, loading: false } as never);

    const html = renderToStaticMarkup(React.createElement(LoginPage));

    expect(html).toContain("Welcome back");
    expect(html).toContain("Continue with Google");
    expect(html).toContain("Create a student account");
  });

  it("renders signup page shell", () => {
    useAuthMock.mockReturnValue({ user: null, loading: false } as never);

    const html = renderToStaticMarkup(React.createElement(SignupPage));

    expect(html).toContain("Create your account");
    expect(html).toContain("Continue with Google");
    expect(html).toContain("Already have an account?");
  });
});
