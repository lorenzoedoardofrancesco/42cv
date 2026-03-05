import Link from "next/link";
import { signOut } from "next-auth/react";
import React, { useContext } from "react";
import _42BadgeLogo from "./42BadgeLogo";
import { AuthContext } from "../lib/auth/AuthProvider";

const Nav: React.FC = () => {
  const { data } = useContext(AuthContext);

  return (
    <header className="fixed z-10 top-0 border-b border-neutral-800 bg-[#0a0a0a]/80 backdrop-filter backdrop-blur-xl w-full">
      <div className="flex justify-between items-center mx-auto max-w-screen-sm w-full h-12 p-2">
        <Link href={"/"}>
          <_42BadgeLogo className="w-10 h-10 fill-white" />
        </Link>
        <div className="flex gap-3 text-sm font-medium text-neutral-400">
          {data && (
            <Link href={"/me"} className="hover:text-white transition-colors">
              {data.name}
            </Link>
          )}
          {data ? (
            <button className="hover:text-white transition-colors" onClick={() => signOut()}>
              Sign Out
            </button>
          ) : (
            <Link href={"/auth/signin"} className="hover:text-white transition-colors">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Nav;
