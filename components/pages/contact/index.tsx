import * as React from "react";

interface ContactProps {}

const Contact: React.FC<ContactProps> = () => {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState("");

  return (
    <div id="contact" className="page-content">
      <div className="page-container">
        <h1 className="title">
          <span>G</span>et in Touch
        </h1>
      </div>

      <div className="divider line__bottom-left" />

      <div className="page-container">
        <div className="map pt-3 pb-2">
          <div className="mapouter">
            <div className="gmap_canvas">
              <iframe
                className="gmap_iframe"
                width="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                src="https://maps.google.com/maps?width=600&amp;height=400&amp;hl=en&amp;q=6.413005031705226, 7.5173114519599755&amp;t=&amp;z=15&amp;ie=UTF8&amp;iwloc=B&amp;output=embed"
              ></iframe>
              <a href="https://formatjson.org/">format json</a>
            </div>
          </div>
        </div>

        <ul className="property-list pt-2">
          <li>
            <span className="property">Email</span>
            <span className="separator">.........</span>
            <span className="value">
              <a href="mailto:nnamanikester@gmail.com">
                nnamanikester@gmail.com
              </a>
            </span>
          </li>
          <li>
            <span className="property">Phone</span>
            <span className="separator">.........</span>
            <span className="value">
              <a href="tel:+2348101584839">+2348101584839</a>
            </span>
          </li>
          <li>
            <span className="property">Address</span>
            <span className="separator">.........</span>
            <span className="value">Enugu, Nigeria</span>
          </li>
          <li>
            <span className="property">Address</span>
            <span className="separator">.........</span>
            <span className="value">Enugu, Nigeria</span>
          </li>
        </ul>
      </div>

      <div className="page-container">
        <h1 className="title mt-3">
          <span>G</span>et in Touch
        </h1>
      </div>

      <div className="divider line__bottom-left" />

      <div className="page-container">
        <form action="#" className="mb-4">
          <div className="form mt-3">
            <div className="row">
              <div className="col-6 pr-1 mb-sm-2">
                <input
                  className="input"
                  placeholder="Full Name"
                  value={name}
                  onChange={({ target }) => setName(target.value)}
                />
              </div>
              <div className="col-6 pl-1">
                <input
                  className="input"
                  placeholder="Email"
                  value={email}
                  onChange={({ target }) => setEmail(target.value)}
                />
              </div>
              <div className="col-12 mt-3">
                <textarea
                  rows={4}
                  className="input"
                  placeholder="Your Message"
                  onChange={({ target }) => setMessage(target.value)}
                >
                  {message}
                </textarea>
              </div>
            </div>
          </div>

          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
            }}
            className="link mt-3"
          >
            Send Message <span className="fa fa-long-arrow-right"></span>
          </a>
        </form>
      </div>
    </div>
  );
};

export default Contact;
