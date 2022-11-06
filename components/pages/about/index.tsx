import * as React from "react";
import cx from "classnames";
import Router, { useRouter } from "next/router";
import Image from "next/image";
import Quote from "../../Quote";

interface AboutProps {}

const About: React.FC<AboutProps> = () => {
  const [showPage, setShowPage] = React.useState(true);

  const changePage = () => {
    if (document.location.hash == "" || document.location.hash == "#") {
      setShowPage(true);
    } else {
      setShowPage(false);
    }
  };

  React.useEffect(() => {
    changePage();
    window.addEventListener("hashchange", (e) => {
      e.preventDefault();

      changePage();
    });
  }, []);

  return (
    <div
      id="about"
      className={cx({ "page-content": true, "open-page": showPage })}
    >
      <div className="page-container">
        <h1 className="title">
          <span>A</span>bout Me
        </h1>
      </div>

      <div className="divider line__bottom-left" />

      <div className="page-container">
        <p className="pt-2">
          I am Ryan Adlard, web designer from USA, California. I have rich
          experience in web site design and building and customization, also I
          am good at wordpress. I love to talk with you about our unique.
        </p>

        <ul className="property-list pt-2">
          <li>
            <span className="property">Age</span>
            <span className="separator">.........</span>
            <span className="value">23</span>
          </li>
          <li>
            <span className="property">Residence</span>
            <span className="separator">.........</span>
            <span className="value">Nigeria</span>
          </li>
          <li>
            <span className="property">Freelance</span>
            <span className="separator">.........</span>
            <span className="value">Available</span>
          </li>
          <li>
            <span className="property">Address</span>
            <span className="separator">.........</span>
            <span className="value">Enugu, Nigeria</span>
          </li>
        </ul>
      </div>

      <div className="page-container">
        <div className="title mt-3">
          <span>M</span>y Services
        </div>
      </div>

      <div className="divider line__bottom-left" />

      <div className="page-container--full-width">
        <div className="row">
          <div className="col-6 py-2 px-3 line__right-top line__bottom-left">
            <div className="feature">
              <div className="feature-icon mb-2">
                <span className="icon fa fa-user"></span>
              </div>
              <h3 className="feature-title">Web Development</h3>
              <p>
                Modern and mobile-ready website that will help you reach all of
                your marketing.
              </p>
            </div>
          </div>
          <div className="col-6 py-2 px-3 line__bottom-left">
            <div className="feature">
              <div className="feature-icon mb-2">
                <span className="icon fa fa-user"></span>
              </div>
              <h3 className="feature-title">Web Development</h3>
              <p>
                Modern and mobile-ready website that will help you reach all of
                your marketing.
              </p>
            </div>
          </div>
          <div className="col-6 py-2 px-3 line__bottom-left line__right-top">
            <div className="feature">
              <div className="feature-icon mb-2">
                <span className="icon fa fa-user"></span>
              </div>
              <h3 className="feature-title">Web Development</h3>
              <p>
                Modern and mobile-ready website that will help you reach all of
                your marketing.
              </p>
            </div>
          </div>
          <div className="col-6 py-2 px-3 line__bottom-left">
            <div className="feature">
              <div className="feature-icon mb-2">
                <span className="icon fa fa-user"></span>
              </div>
              <h3 className="feature-title">Web Development</h3>
              <p>
                Modern and mobile-ready website that will help you reach all of
                your marketing.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="page-container">
        <h1 className="title mt-3">
          <span>F</span>
          un Fact
        </h1>
      </div>

      <div className="divider line__bottom-left" />

      <div className="page-container--full-width">
        <div className="row">
          <div className="col-3 line__right-top p-2">
            <div className="fact">
              <div className="fact-icon">
                <span className="icon fa fa-user"></span>
              </div>
              <h3 className="fact-title">80 Albums Listened</h3>
            </div>
          </div>
          <div className="col-3 line__right-top p-2">
            <div className="fact">
              <div className="fact-icon">
                <span className="icon fa fa-user"></span>
              </div>
              <h3 className="fact-title">15 Awards Won</h3>
            </div>
          </div>
          <div className="col-3 line__right-top p-2">
            <div className="fact">
              <div className="fact-icon">
                <span className="icon fa fa-user"></span>
              </div>
              <h3 className="fact-title">1000 Cups of Coffee</h3>
            </div>
          </div>
          <div className="col-3 p-2">
            <div className="fact">
              <div className="fact-icon">
                <span className="icon fa fa-user"></span>
              </div>
              <h3 className="fact-title">10 Countries Visited</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="page-container">
        <h1 className="title mt-3">
          <span>M</span>y Favorites
        </h1>
      </div>

      <div className="divider line__bottom-left" />

      <div className="page-container">
        <div className="row">
          <div className="col-3 line__right-top p-2">
            <div className="favorite">
              <Image
                src={require("/public/icons/javascript.svg")}
                alt="Javascript Logo"
                width={20}
                height={20}
                className="favorite-image"
              />
            </div>
          </div>
          <div className="col-3 line__right-top p-2">
            <div className="favorite">
              <Image
                src={require("/public/icons/typescript.svg")}
                alt="Typescript Logo"
                width={20}
                height={20}
                className="favorite-image"
              />
            </div>
          </div>
          <div className="col-3 line__right-top p-2">
            <div className="favorite">
              <Image
                src={require("/public/icons/react.svg")}
                alt="React Logo"
                width={20}
                height={20}
                className="favorite-image"
              />
            </div>
          </div>
          <div className="col-3  p-2">
            <div className="favorite">
              <Image
                src={require("/public/icons/redux.svg")}
                alt="Redux Logo"
                width={20}
                height={20}
                className="favorite-image"
              />
            </div>
          </div>
          <div className="col-3 line__right-top line__top-right p-2">
            <div className="favorite">
              <Image
                src={require("/public/icons/nextjs.svg")}
                alt="Nextjs Logo"
                width={20}
                height={20}
                className="favorite-image"
              />
            </div>
          </div>
          <div className="col-3 line__right-top line__top-right p-2">
            <div className="favorite">
              <Image
                src={require("/public/icons/github.svg")}
                alt="Github Logo"
                width={20}
                height={20}
                className="favorite-image"
              />
            </div>
          </div>
          <div className="col-3 line__right-top line__top-right p-2">
            <div className="favorite">
              <Image
                src={require("/public/icons/sass.svg")}
                alt="SASS Logo"
                width={20}
                height={20}
                className="favorite-image"
              />
            </div>
          </div>
          <div className="col-3 line__top-left p-2">
            <div className="favorite">
              <Image
                src={require("/public/icons/android.svg")}
                alt="Android Logo"
                width={20}
                height={20}
                className="favorite-image"
              />
            </div>
          </div>
          <div className="col-3 line__right-top line__top-right p-2">
            <div className="favorite">
              <Image
                src={require("/public/icons/aws.svg")}
                alt="AWS Logo"
                width={20}
                height={20}
                className="favorite-image"
              />
            </div>
          </div>
          <div className="col-3 line__right-top line__top-right p-2">
            <div className="favorite">
              <Image
                src={require("/public/icons/graphql.svg")}
                alt="GraphQL Logo"
                width={20}
                height={20}
                className="favorite-image"
              />
            </div>
          </div>
          <div className="col-3 line__right-top line__top-right p-2">
            <div className="favorite">
              <Image
                src={require("/public/icons/slack.svg")}
                alt="Slack Logo"
                width={20}
                height={20}
                className="favorite-image"
              />
            </div>
          </div>
          <div className="col-3 line__top-left p-2">
            <div className="favorite">
              <Image
                src={require("/public/icons/zoom.svg")}
                alt="Zoom Logo"
                width={20}
                height={20}
                className="favorite-image"
              />
            </div>
          </div>
          <div className="col-3 line__right-top line__top-right p-2">
            <div className="favorite">
              <Image
                src={require("/public/icons/jira.svg")}
                alt="JIRA Logo"
                width={20}
                height={20}
                className="favorite-image"
              />
            </div>
          </div>
          <div className="col-3 line__right-top line__top-right p-2">
            <div className="favorite">
              <Image
                src={require("/public/icons/firebase.svg")}
                alt="Firebase Logo"
                width={20}
                height={20}
                className="favorite-image"
              />
            </div>
          </div>
          <div className="col-3 line__right-top line__top-right p-2">
            <div className="favorite">
              <Image
                src={require("/public/icons/notion.svg")}
                alt="Notion Logo"
                width={20}
                height={20}
                className="favorite-image"
              />
            </div>
          </div>
          <div className="col-3 line__top-left p-2">
            <div className="favorite">
              <Image
                src={require("/public/icons/meta.svg")}
                alt="Meta Logo"
                width={20}
                height={20}
                className="favorite-image"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="page-container">
        <h1 className="title mt-3">
          <span>Q</span>uote
        </h1>
      </div>

      <div className="divider line__bottom-left" />

      <div className="page-container pt-2">
        <Quote
          name="John Nnamani"
          title="Software Engineer"
          text="Lorem ipsum dolor sit amet consectetur adipisicing elit. Laboriosam corporis accusamus laudantium repellat sunt vel voluptatibus dignissimos dolore libero quis labore,"
          photo={require("/public/images/profile.png")}
        />
      </div>
    </div>
  );
};

export default About;
