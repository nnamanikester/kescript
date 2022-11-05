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

const Home = () => {
  return (
    <div>
      <div className="container">
        <div className="row">
          <Header />
          <div className="col-4">
            <HeroCard />
          </div>
          <div className="col-7 page">
            <Resume />
            <Works />
            <Blog />
            <About />
            <Contact />
          </div>
        </div>
      </div>
      <BgBubble />
    </div>
  );
};

export default Home;
