import * as React from "react";
import cx from "classnames";
import articles from "../../../db/articles";
import { useArticleStore } from "../../../state";
import Image from "next/image";
import dayjs from "dayjs";

interface BlogProps {}

const Blog: React.FC<BlogProps> = () => {
  const selectedArticle = useArticleStore((state) => state.article);
  const setSelectedArticle = useArticleStore((state) => state.setArticle);
  return (
    <div id="blog" className="page-content">
      <div className="page-container">
        <h1 className="title">
          <span>B</span>log
        </h1>
      </div>

      <div className="divider line__bottom-left" />

      <div className="page-container">
        <div className="row mt-3">
          {articles.map((a, i) => {
            const odd = i % 2 > 0;
            const even = i % 2 === 0;

            return (
              <div
                key={a.id}
                className={cx({
                  "col-6": true,
                  "pr-2": even,
                  "pl-2": odd,
                  "line__right-bottom": even,
                })}
              >
                <div className="article">
                  <div
                    className="clickable"
                    onClick={() => setSelectedArticle(a)}
                  >
                    <div className="article-image">
                      <Image
                        src={a.image as any}
                        alt={a.title}
                        width={200}
                        height={200}
                      />
                      <span className="fa fa-file-text fa-lg"></span>
                    </div>
                    <span className="article-date">
                      {dayjs(a.date).format("MMM, DD YYYY")}
                    </span>
                    <h4 className="article-title">{a.title}</h4>
                  </div>
                  <p className="article-exerpt">{a.exerpt}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Blog;
