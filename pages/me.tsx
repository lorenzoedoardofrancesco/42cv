import { signIn, signOut } from "next-auth/react";
import Layout from "../components/Layout";
import collection from "lodash-es/collection";
import LoginButton42School from "../components/LoginButton42School";
import { useState } from "react";
import axios from "axios";
import { AuthContext, withAuth } from "../lib/auth/AuthProvider";
import { useContext } from "react";
import Link from "next/link";

const NewUserPage = () => {
  const {
    data: { accounts, email, name },
  } = useContext(AuthContext);
  const accountsObj = collection.keyBy(accounts, "provider");
  const is42Connected = !!accountsObj["42-school"];

  return (
    <Layout>
      {/* Profile */}
      <section className="space-y-4">
        <h1 className="text-xl font-semibold text-white">Profile</h1>
        <div className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-lg space-y-2">
          <div className="flex gap-2 text-sm">
            <span className="text-neutral-500 w-24 shrink-0">Name</span>
            <span className="text-neutral-200">{name}</span>
          </div>
          <div className="flex gap-2 text-sm">
            <span className="text-neutral-500 w-24 shrink-0">Email</span>
            <span className="text-neutral-200">{email}</span>
          </div>
          <div className="flex gap-2 text-sm">
            <span className="text-neutral-500 w-24 shrink-0">42 Account</span>
            {is42Connected ? (
              <span className="text-green-400">Connected</span>
            ) : (
              <span className="text-red-400">Not connected</span>
            )}
          </div>
        </div>
      </section>

      {/* Connect 42 account if not linked */}
      {!is42Connected && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Connect 42 Account</h2>
          <p className="text-sm text-neutral-500">
            Required to generate your badge.
          </p>
          <LoginButton42School onClick={() => signIn("42-school")} />
        </section>
      )}

      {/* Danger Zone */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-red-500">Danger Zone</h2>
        <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-lg space-y-3">
          <p className="text-sm text-neutral-400">
            Removes your account from the 42Badge database. Your badge URL will stop working and your cached 42 data will be deleted. Your 42 intra account is not affected.
          </p>
          <DeleteUser />
        </div>
      </section>

      <Link href={"/"} className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors">
        ← Back to badges
      </Link>
    </Layout>
  );
};

const DeleteUser = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleOnClick = async () => {
    if (confirm("This operation cannot be canceled. Are you sure?")) {
      setIsLoading(true);
      try {
        await axios.delete("/api/v2/me", {
          withCredentials: true,
        });
        alert("Account deleted.");
        signOut();
      } catch (error) {
        alert("Failed to delete account.");
      }
      setIsLoading(false);
    }
  };

  return (
    <button
      className="w-full py-2 rounded-lg text-sm font-medium bg-red-700 hover:bg-red-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={isLoading}
      onClick={handleOnClick}
    >
      {isLoading ? "Deleting..." : "Delete Account"}
    </button>
  );
};

export default withAuth(NewUserPage);
