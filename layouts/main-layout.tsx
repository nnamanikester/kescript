import * as React from "react";

interface MainLayoutProps {
  children: React.ReactElement;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <>
      <div className="main-layout">
        <main>{children}</main>
      </div>
    </>
  );
};

export default MainLayout;
