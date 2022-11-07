import React from "react";

interface ShopkingMobileProps {}

const ShopkingMobile: React.FC<ShopkingMobileProps> = () => {
  return (
    <>
      <div className="py-3">
        <h1 className="bold">Shopking</h1>
        <p className="note">Mobile Application</p>

        <div className="divider line__bottom-left my-2" />

        <p className="mb-2">
          Shopking is an errand platform that helps it&apos;s users focus on
          important things that matters to them while they do their
          shopping/errands.
        </p>

        <p className="mb-2">I built the shopking website using NextJS.</p>

        <a href="https://shopking.ng" className="link" target="__blank">
          View Project <span className="fa fa-external-link"></span>
        </a>
      </div>
    </>
  );
};

export default ShopkingMobile;
