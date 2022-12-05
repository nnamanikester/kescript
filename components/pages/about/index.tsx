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
        <p className="pt-3">
          I am John Nnamani, Experienced Software Engineer with a passion for
          mobile and web app development. Recognized for strong problem-solving
          skills and an ability to quickly learn new technologies. Eager to join
          a team of talented engineers and help build world-class solutions.
        </p>
        <br />
        <p>
          Despite the fact that I enjoy working solo, I&apos;ve found working
          with teams equally rewarding because I feel it&apos;s one of the most
          effective ways to harness human resources. I&apos;m looking for
          projects that are challenging enough if completed would be considered
          magical.
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
            <span className="property">Contract</span>
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
          <span>M</span>y Stack
        </div>
      </div>

      <div className="divider line__bottom-left" />

      <div className="page-container--full-width">
        <div className="row">
          <div className="col-6 py-2 px-3 line__right-top">
            <div className="feature">
              <div className="feature-icon mb-2">
                <span className="icon fa fa-user"></span>
              </div>
              <h3 className="feature-title">Mobile Development</h3>
              <p>
                Javascript, Typescript, React, React Native, Redux, Zustand,
                Nativebase, React native paper, GraphQL, Firebase, Apollo,
                XCode, Android Studio, Kotlin, Swift, Bitrise, CircleCI, App
                Store, Playstore, App Center, Expo EAS
              </p>
            </div>
          </div>
          <div className="col-6 py-2 px-3">
            <div className="feature">
              <div className="feature-icon mb-2">
                <span className="icon fa fa-user"></span>
              </div>
              <h3 className="feature-title">Web Development</h3>
              <p>
                Javascript, Typescript, HTML, CSS, SCSS, React, NextJS, Redux,
                Tailwind, Bootstrap, Styled Components, NodeJS, Express,
                MongoDB, MySQL, GraphQL, Apollo, Git/Github, Vercel, Netlify
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
          <div className="col-3 col-sm-6 p-2">
            <div className="fact">
              <div className="fact-icon">
                <span className="icon fa fa-user"></span>
              </div>
              <h3 className="fact-title">80 Albums Listened</h3>
            </div>
          </div>
          <div className="col-3 col-sm-6 line__left-top p-2">
            <div className="fact">
              <div className="fact-icon">
                <span className="icon fa fa-user"></span>
              </div>
              <h3 className="fact-title">15 Awards Won</h3>
            </div>
          </div>
          <div className="col-3 col-sm-6 line__left-top p-2">
            <div className="fact">
              <div className="fact-icon">
                <span className="icon fa fa-user"></span>
              </div>
              <h3 className="fact-title">1000 Cups of Coffee</h3>
            </div>
          </div>
          <div className="col-3 col-sm-6 p-2 line__left-top">
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

      <div className="page-container page-container--sm-full-width">
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
          text={
            "Good code is it's own documentation. As you're about to add a comment, ask yourself: \"How can I imporive the code so that this comment isn't needed?\""
          }
          photo={require("/public/images/profile.png")}
        />
      </div>
    </div>
  );
};

export default About;
