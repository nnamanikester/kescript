import * as React from "react";
import BubbleScale from "../../BubbleScale";
import CircleProgress from "../../CircleProgress";
import LinearProgress from "../../LinearProgress";
import Quote from "../../Quote";

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
              <span className="experience-year active">2020 - Present</span>
              <h3 className="experience-title">Art Director</h3>
              <span className="experience-subtitle">Destreetboard Inc.</span>
              <p>
                Collaborate with creative and development teams on the execution
                of ideas.
              </p>
            </div>

            <div className="experience line__bottom-left">
              <span className="experience-year">2020 - Present</span>
              <h3 className="experience-title">Art Director</h3>
              <span className="experience-subtitle">Destreetboard Inc.</span>
              <p>
                Collaborate with creative and development teams on the execution
                of ideas.
              </p>
            </div>

            <div className="experience">
              <span className="experience-year">2020 - Present</span>
              <h3 className="experience-title">Art Director</h3>
              <span className="experience-subtitle">Destreetboard Inc.</span>
              <p>
                Collaborate with creative and development teams on the execution
                of ideas.
              </p>
            </div>
          </div>

          <div className="col-6  pl-3">
            <h3 className="line__bottom-left title-2 mb-2">
              <span className="icon fa fa-university"></span>
              <span>Education</span>
            </h3>

            <div className="experience line__bottom-left">
              <span className="experience-year">2018 - 2022</span>
              <h3 className="experience-title">Enugu State University</h3>
              <span className="experience-subtitle">Enugu, Nigeria.</span>
              <p>
                Bachelor&apos;s Degree in Computer Science Enugu State
                University of Science and Technology, Enugu.
              </p>
            </div>

            <div className="experience line__bottom-left">
              <span className="experience-year">2020</span>
              <h3 className="experience-title">Programming Course</h3>
              <span className="experience-subtitle">Udemy</span>
              <p>
                Collaborate with creative and development teams on the execution
                of ideas.
              </p>
            </div>

            <div className="experience">
              <span className="experience-year">2018</span>
              <h3 className="experience-title">React Native Course</h3>
              <span className="experience-subtitle">Udemy</span>
              <p>
                Collaborate with creative and development teams on the execution
                of ideas.
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
          <div className="col-6 line__right-top pr-3  mb-4">
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
                <CircleProgress title="XCode" percentage={40} />
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
              <BubbleScale title="French" score={5} />
            </div>

            <div className="col-12 mb-1">
              <BubbleScale title="Spanish" score={3} />
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
              <LinearProgress title="JavaScript" percentage={95} />
            </div>

            <div className="col-12 line__bottom-left mb-1">
              <LinearProgress title="Typescript" percentage={90} />
            </div>

            <div className="col-12 line__bottom-left mb-1">
              <LinearProgress title="React" percentage={98} />
            </div>

            <div className="col-12 line__bottom-left mb-1">
              <LinearProgress title="React Native" percentage={90} />
            </div>

            <div className="col-12 mb-1">
              <LinearProgress title="Next JS" percentage={90} />
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

export default Resume;
