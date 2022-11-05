import * as React from "react";

interface ResumeProps {}

const Resume: React.FC<ResumeProps> = () => {
  return (
    <div id="resume" className="page-content">
      <div className="page-container">
        <h1 className="title">
          <span>R</span>esume
        </h1>
      </div>

      <div className="divider line__bottom-left" />
    </div>
  );
};

export default Resume;
