import * as React from "react";
import cx from "classnames";

interface BubbleScaleProps {
  title: string;
  score: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
}

const BubbleScale: React.FC<BubbleScaleProps> = ({ title, score }) => {
  return (
    <>
      <div className="bubble-scale">
        <span className="title">{title}</span>
        <div className="bubbles">
          <div className={cx({ active: score >= 1 })} />
          <div className={cx({ active: score >= 2 })} />
          <div className={cx({ active: score >= 3 })} />
          <div className={cx({ active: score >= 4 })} />
          <div className={cx({ active: score >= 5 })} />
          <div className={cx({ active: score >= 6 })} />
          <div className={cx({ active: score >= 7 })} />
          <div className={cx({ active: score >= 8 })} />
          <div className={cx({ active: score >= 9 })} />
          <div className={cx({ active: score === 10 })} />
        </div>
      </div>
    </>
  );
};

export default BubbleScale;
