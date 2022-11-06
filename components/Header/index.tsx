import * as React from "react";
import cx from "classnames";

interface HeaderProps {}

const Header: React.FC<HeaderProps> = () => {
  const [page, setPage] = React.useState<
    "#about" | "#resume" | "#works" | "#blog" | "#contact" | "#" | ""
  >("");

  React.useEffect(() => {
    setPage(document.location.hash as any);

    window.addEventListener("hashchange", (e) => {
      e.preventDefault();
      setPage(document.location.hash as any);
    });
  }, []);

  return (
    <header className="header">
      <ul className="nav">
        <li>
          <a
            href="#about"
            className={
              page == "#about" || page == "#" || page == "" ? "active" : ""
            }
          >
            <i className="icon fa fa-user"></i>
            <span>About</span>
          </a>
        </li>
        <li>
          <a
            href="#resume"
            className={cx({
              "line__top-right": true,
              active: page == "#resume",
            })}
          >
            <i className="icon fa fa-file-pdf"></i>
            <span>Resume</span>
          </a>
        </li>
        <li>
          <a
            href="#works"
            className={cx({
              "line__top-right": true,
              active: page == "#works",
            })}
          >
            <i className="icon fa fa-briefcase"></i>
            <span>Works</span>
          </a>
        </li>
        <li>
          <a
            href="#blog"
            className={cx({
              "line__top-right": true,
              active: page == "#blog",
            })}
          >
            <i className="icon fa fa-rss"></i>
            <span>Blog</span>
          </a>
        </li>
        <li>
          <a
            href="#contact"
            className={cx({
              "line__top-right": true,
              active: page == "#contact",
            })}
          >
            <i className="icon fa fa-at"></i>
            <span>Contact</span>
          </a>
        </li>
      </ul>
    </header>
  );
};

export default Header;
