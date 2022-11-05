import * as React from "react";

interface BlogProps {}

const Blog: React.FC<BlogProps> = () => {
  return (
    <div id="blog" className="page-content">
      <div className="page-container">
        <h1 className="title">
          <span>B</span>log
        </h1>
      </div>

      <div className="divider line__bottom-left" />
    </div>
  );
};

export default Blog;
