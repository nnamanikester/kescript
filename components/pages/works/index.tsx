import * as React from "react";

interface WorksProps {}

const Works: React.FC<WorksProps> = () => {
  return (
    <div id="works" className="page-content">
      <div className="page-container">
        <h1 className="title">
          <span>W</span>orks
        </h1>
      </div>

      <div className="divider line__bottom-left" />
    </div>
  );
};

export default Works;
