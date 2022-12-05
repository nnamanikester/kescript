import * as React from "react";
import cx from "classnames";
import BubbleScale from "../../BubbleScale";
import CircleProgress from "../../CircleProgress";
import LinearProgress from "../../LinearProgress";
import Quote from "../../Quote";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css/pagination";
import { Pagination } from "swiper";

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

      <div className="page-container">
        <div className="row">
          <div className="col-6 line__right-top pr-3">
            <h3 className="line__bottom-left title-2 mb-2">
              <span className="icon fa fa-briefcase"></span>
              <span>Experience</span>
            </h3>

            <div className="experience line__bottom-left">
              <span className={cx({ "experience-year": true, active: false })}>
                Nov. 2021 - Jun. 2022
              </span>
              <h3 className="experience-title">Mobile App QA Engineer</h3>
              <span className="experience-subtitle">
                Maharishi Foundation International
              </span>
              <p>
                Developed E2E test suits for the TM app using Detox and Jest to
                eliminate the manual method of testing the TM app.
              </p>
            </div>

            <div className="experience line__bottom-left">
              <span className="experience-year">Feb. 2020 - July 2021</span>
              <h3 className="experience-title">React Native Engineer</h3>
              <span className="experience-subtitle">Destreetboard Inc.</span>
              <p>
                Developed and mainained company&apos;s mobile app products built
                with react native and deployed to Playstore and App Store.
              </p>
            </div>

            <div className="experience">
              <span className="experience-year">Sep. 2020 - Feb. 2021</span>
              <h3 className="experience-title">React Native Developer</h3>
              <span className="experience-subtitle">SooleRide Limited</span>
              <p>
                Rebuild the entire UI of the SooleRide app and implemented new
                features as was designed by the UI/UX designer.
              </p>
            </div>
          </div>

          <div className="col-6  pl-3">
            <h3 className="line__bottom-left title-2 mb-2">
              <span className="icon fa fa-university"></span>
              <span>Education</span>
            </h3>

            <div className="experience line__bottom-left">
              <span className="experience-year active">2018 - 2022</span>
              <h3 className="experience-title">
                Enugu State University of Science and Technology
              </h3>
              <span className="experience-subtitle">
                B.Sc in Computer Science.
              </span>
              <p>
                Bachelor&apos;s Degree in Computer Science - Enugu State
                University of Science and Technology, Enugu, Nigeria.
              </p>
            </div>

            <div className="experience line__bottom-left">
              <span className="experience-year">2019</span>
              <h3 className="experience-title">
                React Native - The Practical Guide
              </h3>
              <span className="experience-subtitle">Udemy</span>
              <p>
                Develop cross-platform (iOS and Android) mobile apps with
                ReactJS knowledge.
              </p>
            </div>

            <div className="experience">
              <span className="experience-year">2018</span>
              <h3 className="experience-title">Eloquent Javascript</h3>
              <span className="experience-subtitle">
                Programming with Javascript
              </span>
              <p>
                Introduces you to the JavaScript language. It also covers
                general programming concepts such as object-oriented
                programming.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="page-container">
        <h1 className="title">
          <span>M</span>y Skills
        </h1>
      </div>

      <div className="divider line__bottom-left" />

      <div className="page-container">
        <div className="row">
          <div className="col-6 line__right-top pr-3 pr-sm-0 mb-4">
            <h3 className="line__bottom-left title-2 mb-2">
              <span className="icon fa fa-briefcase"></span>
              <span>Tools</span>
            </h3>

            <div className="row">
              <div className="col-4">
                <CircleProgress title="Github" percentage={85} />
              </div>
              <div className="col-4">
                <CircleProgress title="VSCode" percentage={90} />
              </div>
              <div className="col-4">
                <CircleProgress title="Android" percentage={50} />
              </div>
              <div className="col-4">
                <CircleProgress title="XCode" percentage={60} />
              </div>
              <div className="col-4">
                <CircleProgress title="JIRA" percentage={90} />
              </div>
              <div className="col-4">
                <CircleProgress title="Figma" percentage={90} />
              </div>
              <div className="col-4">
                <CircleProgress title="Slack" percentage={95} />
              </div>
              <div className="col-4">
                <CircleProgress title="Confluence" percentage={80} />
              </div>
              <div className="col-4">
                <CircleProgress title="Notion" percentage={95} />
              </div>
            </div>
          </div>

          <div className="col-6  pl-3 mb-2">
            <h3 className="line__bottom-left title-2 mb-2">
              <span className="icon fa fa-university"></span>
              <span>Languages</span>
            </h3>

            <div className="col-12 line__bottom-left mb-1">
              <BubbleScale title="English" score={8} />
            </div>

            <div className="col-12 line__bottom-left mb-1">
              <BubbleScale title="German" score={1} />
            </div>

            <div className="col-12 line__bottom-left mb-1">
              <BubbleScale title="French" score={3} />
            </div>

            <div className="col-12 mb-1">
              <BubbleScale title="Spanish" score={2} />
            </div>
          </div>
        </div>
      </div>

      <div className="page-container">
        <div className="row">
          <div className="col-6 line__right-top pr-3">
            <h3 className="line__bottom-left title-2 mb-2">
              <span className="icon fa fa-briefcase"></span>
              <span>Coding</span>
            </h3>

            <div className="col-12 line__bottom-left mb-1">
              <LinearProgress title="JavaScript" percentage={90} />
            </div>

            <div className="col-12 line__bottom-left mb-1">
              <LinearProgress title="Typescript" percentage={80} />
            </div>

            <div className="col-12 line__bottom-left mb-1">
              <LinearProgress title="React" percentage={90} />
            </div>

            <div className="col-12 line__bottom-left mb-1">
              <LinearProgress title="React Native" percentage={85} />
            </div>

            <div className="col-12 mb-1">
              <LinearProgress title="Next JS" percentage={80} />
            </div>
          </div>

          <div className="col-6  pl-3">
            <h3 className="line__bottom-left title-2 mb-3">
              <span className="icon fa fa-university"></span>
              <span>Knowledge</span>
            </h3>

            <div className="knowledge">
              <ul className="fa-ul">
                <li>
                  <span className="fa-li">
                    <i className="fas fa-check fa-lg"></i>
                  </span>
                  App Store Listing
                </li>
                <li>
                  <span className="fa-li">
                    <i className="fas fa-check fa-lg"></i>
                  </span>
                  Playtore Listing
                </li>
                <li>
                  <span className="fa-li">
                    <i className="fas fa-check fa-lg"></i>
                  </span>
                  Website Hosting
                </li>
                <li>
                  <span className="fa-li">
                    <i className="fas fa-check fa-lg"></i>
                  </span>
                  Unit/End to End Testing (Jest/Detox)
                </li>
                <li>
                  <span className="fa-li">
                    <i className="fas fa-check fa-lg"></i>
                  </span>
                  Bitrise
                </li>
                <li>
                  <span className="fa-li">
                    <i className="fas fa-check fa-lg"></i>
                  </span>
                  App Center
                </li>
                <li>
                  <span className="fa-li">
                    <i className="fas fa-check fa-lg"></i>
                  </span>
                  Expo EAS
                </li>
                <li>
                  <span className="fa-li">
                    <i className="fas fa-check fa-lg"></i>
                  </span>
                  Vercel
                </li>
                <li>
                  <span className="fa-li">
                    <i className="fas fa-check fa-lg"></i>
                  </span>
                  Netlify
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="page-container">
        <h1 className="title mt-2">
          <span>R</span>eferences
        </h1>
      </div>

      <div className="divider line__bottom-left" />

      <div className="page-container pt-2">
        <Swiper
          spaceBetween={50}
          slidesPerView={1}
          modules={[Pagination]}
          pagination={{ clickable: true }}
          autoplay
        >
          <SwiperSlide>
            <Quote
              name="Victor Nwagu"
              title="Backend Engineer"
              text="Way to stay on your edge and challenge yourself. I appreciate all your positive contributions in project success. I want to say I admire the efforts you put in delivering solutions and I’m proud of the way you took the initiative to grow in your role. Thanks for being a great colleague."
              photo={require("/public/images/references/victor-nwagu.jpg")}
            />
          </SwiperSlide>
        </Swiper>
      </div>
    </div>
  );
};

export default Resume;
