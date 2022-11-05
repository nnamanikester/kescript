import Image from "next/image";
import * as React from "react";

interface HeroCardProps {}

const HeroCard: React.FC<HeroCardProps> = () => {
  return (
    <>
      <div className="hero-card">
        <div className="hero-card__header">
          <div className="hero-card__slider" />
          <div className="hero-card__image">
            <Image
              src={require("/public/images/profile.png")}
              alt="Profile"
              width={100}
              height={100}
            />
          </div>
        </div>
        <div className="hero-card__body">
          <h1>John Nnamani</h1>
          <h3 className="hero-card__job-title"></h3>
          <ul className="hero-card__social">
            <li>
              <a href="https://github.com/nnamaikester" target="__blank">
                <i className="fab fa-github"></i>
              </a>
            </li>
            <li>
              <a href="https://linkedin.com/in/nnamanikester" target="__blank">
                <i className="fab fa-linkedin"></i>
              </a>
            </li>
            <li>
              <a href="https://twitter.com/kescript" target="__blank">
                <i className="fab fa-twitter"></i>
              </a>
            </li>
            <li>
              <a
                href="https://stackoverflow.com/users/16030838/kescript"
                target="__blank"
              >
                <i className="fab fa-stack-overflow"></i>
              </a>
            </li>
            <li>
              <a href="https://instagram.com/nnamanikester" target="__blank">
                <i className="fab fa-instagram"></i>
              </a>
            </li>
            <li>
              <a href="https://facebook.com/nnamanikester">
                <i className="fab fa-facebook"></i>
              </a>
            </li>
          </ul>
        </div>
        <div className="hero-card__footer">
          <ul>
            <li>
              <a
                href="#"
                target="__blank"
                className="btn line__top-right line__right-top"
              >
                Download CV
              </a>
            </li>
            <li>
              <a href="#" className="btn line__top-left">
                Contact Me
              </a>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default HeroCard;
