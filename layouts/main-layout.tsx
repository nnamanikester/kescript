import * as React from "react";
import MetaTags from "../components/MetaTags";

interface MainLayoutProps {
  children: React.ReactElement[];
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <>
      <MetaTags />
      <div className="main-layout">
        <main>{children}</main>
      </div>
    </>
  );
};

export default MainLayout;
