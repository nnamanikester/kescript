import * as React from "react";

interface LinearProgressProps {
  title: string;
  percentage: number;
}

const LinearProgress: React.FC<LinearProgressProps> = ({
  title,
  percentage,
}) => {
  return (
    <>
      <div className="linear-progress" title={`${title} - ${percentage}%`}>
        <span className="title">{title}</span>
        <div className="track">
          <div className="progress" style={{ width: `${percentage}%` }} />
        </div>
      </div>
    </>
  );
};

export default LinearProgress;
