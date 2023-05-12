import React from "react";

interface PickridersMobileProps {}

const PickridersMobile: React.FC<PickridersMobileProps> = () => {
  return (
    <>
      <div className="py-3">
        <h1 className="bold">Pickriders</h1>
        <p className="note">Mobile Application</p>

        <div className="divider line__bottom-left my-2" />

        <p className="mb-2">
          Pickriders offers dispatch businesses the ability to invest in
          couriers and monitor their inventories and earnings in realtime.
          Pickriders offers dispatch businesses the ability to invest in
          couriers and monitor their inventories and earnings in realtime.
        </p>

        {/* <p className="mb-2">I built the shopking website using NextJS.</p> */}

        <a href="https://pickriders.com" className="link" target="__blank">
          View Project <span className="fa fa-external-link"></span>
        </a>
      </div>
    </>
  );
};

export default PickridersMobile;
