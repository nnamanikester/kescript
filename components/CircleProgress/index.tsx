import * as React from "react";
import cx from "classnames";

interface CircleProgressProps {
  title: string;
  percentage: number;
}

const CircleProgress: React.FC<CircleProgressProps> = ({
  title,
  percentage,
}) => {
  return (
    <>
      <div className="circle-progress ">
        <div>
          <div
            className="progress"
            style={{ ["--circle-progress" as any]: percentage }}
          >
            <div className="percentage-bar">
              <span className="percentage">{percentage}%</span>
            </div>
          </div>

          <span className="title">{title}</span>
        </div>
      </div>
    </>
  );
};

export default CircleProgress;
