import * as React from "react";

interface ContactProps {}

const Contact: React.FC<ContactProps> = () => {
  return (
    <div id="contact" className="page-content">
      <div className="page-container">
        <h1 className="title">
          <span>G</span>et in Touch
        </h1>
      </div>

      <div className="divider line__bottom-left" />
    </div>
  );
};

export default Contact;
