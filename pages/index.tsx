import Image from "next/image";
import * as React from "react";
import BgBubble from "../components/BgBubble";
import Header from "../components/Header";
import HeroCard from "../components/HeroCard";
import About from "../components/pages/about";
import Blog from "../components/pages/blog";
import Contact from "../components/pages/contact";
import Resume from "../components/pages/resume";
import Works from "../components/pages/works";
import { useWorkStore } from "../state";

const Home = () => {
  const selectedWork = useWorkStore((state) => state.work);
  const setSelectedWork = useWorkStore((state) => state.setWork);

  return (
    <div>
      <div className="container">
        <div className="row">
          <Header />
          <div className="col-5 hero">
            <HeroCard />
          </div>
          <div className="col-6 page">
            <About />
            <Resume />
            <Works />
            <Blog />
            <Contact />
          </div>
        </div>
      </div>
      <BgBubble />

      {selectedWork && (
        <div className="work-bg">
          <div
            className="overlay"
            onClick={() => setSelectedWork(undefined)}
          ></div>
          <div className="work-content">
            <span
              onClick={() => setSelectedWork(undefined)}
              className="close-icon fa fa-close"
            ></span>

            <div className="content">
              <div className="content-header">
                <Image
                  src={selectedWork.image as any}
                  alt={selectedWork.name}
                  width={1000}
                  height={1000}
                />
              </div>
              <div className="main-content px-3">{selectedWork?.content}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
