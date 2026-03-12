import React, { PropsWithChildren } from "react";
import Nav from "./Nav";

const Layout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <>
      <Nav />
      <div className="min-h-dvh pt-16 pb-24">
        <div className="flex flex-col gap-6 max-w-screen-sm mx-auto px-4 sm:px-0">
          {children}
        </div>
      </div>
    </>
  );
};

export default Layout;
