import type { NextPage } from "next";
import Head from "next/head";
import LoginButton42School from "../../components/LoginButton42School";
import { signIn } from "next-auth/react";
import _42CvLogo from "../../components/42CvLogo";
import { useContext, useEffect, useState } from "react";
import Layout from "../../components/Layout";
import Link from "next/link";
import { useRouter } from "next/router";
import { AuthContext } from "../../lib/auth/AuthProvider";

export type SignInErrorTypes =
  | "Signin"
  | "OAuthSignin"
  | "OAuthCallback"
  | "OAuthCreateAccount"
  | "EmailCreateAccount"
  | "Callback"
  | "OAuthAccountNotLinked"
  | "EmailSignin"
  | "CredentialsSignin"
  | "SessionRequired"
  | "default";

const errors: Record<SignInErrorTypes, string> = {
  Signin: "Try signing in with a different account.",
  OAuthSignin: "Try signing in with a different account.",
  OAuthCallback: "Try signing in with a different account.",
  OAuthCreateAccount: "Try signing in with a different account.",
  EmailCreateAccount: "Try signing in with a different account.",
  Callback: "Try signing in with a different account.",
  OAuthAccountNotLinked:
    "To confirm your identity, sign in with the same account you used originally.",
  EmailSignin: "The e-mail could not be sent.",
  CredentialsSignin:
    "Sign in failed. Check the details you provided are correct.",
  SessionRequired: "Please sign in to access this page.",
  default: "Unable to sign in.",
};

const SignInPage: NextPage = () => {
  const [callbackUrl, setCallBackUrl] = useState("/");
  const [error, setError] = useState(null);
  const { status } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    const url = new URL(window.location.href);

    const callbackUrl = url.searchParams.get("callbackUrl");
    const error = url.searchParams.get("error");

    if (callbackUrl) setCallBackUrl(callbackUrl);
    setError(error);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  return (
    <Layout>
      <Head>
        <title>42cv.dev</title>
      </Head>
      <div className="flex flex-col gap-4 items-center pt-8">
        <Link href={"/"}>
          <_42CvLogo className="w-32 h-32 fill-white" />
        </Link>
        <h1 className="text-2xl font-bold text-white">Sign In</h1>
        <hr className="border-neutral-800 w-full" />
        {error && error !== "SessionRequired" && (
          <div className="border border-red-800/50 bg-red-950/30 text-red-200/80 rounded-lg p-3 text-sm w-full">
            {errors[error]}
          </div>
        )}
        <div className="flex flex-col gap-2 w-full">
          <LoginButton42School
            onClick={() =>
              signIn("42-school", {
                callbackUrl: callbackUrl,
              })
            }
          />
        </div>
      </div>
    </Layout>
  );
};

export default SignInPage;
