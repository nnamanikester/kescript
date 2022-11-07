import Image from "next/image";
import * as React from "react";
import cx from "classnames";
import { TabType } from "../../../types";
import { useWorkStore } from "../../../state";
import works from "../../../db/works";

interface WorksProps {}

const Works: React.FC<WorksProps> = () => {
  const [activeTab, setActiveTab] = React.useState<TabType>("All");
  const setSelectedWork = useWorkStore((state) => state.setWork);

  const changeTab = (e: any, tab: TabType) => {
    e.preventDefault();
    setActiveTab(tab);
  };

  return (
    <div id="works" className="page-content">
      <div className="page-container header">
        <h1 className="title">
          <span>R</span>ecent Works
        </h1>
        <ul className="tab">
          <li>
            <a
              href="#"
              onClick={(e) => changeTab(e, "All")}
              className={activeTab === "All" ? "active" : ""}
            >
              All
            </a>
          </li>
          <li>
            <a
              href="#"
              onClick={(e) => changeTab(e, "Mobile")}
              className={activeTab === "Mobile" ? "active" : ""}
            >
              Mobile
            </a>
          </li>
          <li>
            <a
              href="#"
              onClick={(e) => changeTab(e, "Web")}
              className={activeTab === "Web" ? "active" : ""}
            >
              Web
            </a>
          </li>
        </ul>
      </div>

      <div className="divider line__bottom-left" />

      <div className="page-container">
        <div className="row mt-3">
          {works
            .filter((w) =>
              w.type === activeTab || activeTab === "All" ? true : false
            )
            .map((w, i) => {
              const odd = i % 2 > 0;
              const even = i % 2 === 0;

              return (
                <div
                  key={w.id}
                  onClick={() => setSelectedWork(w)}
                  className={cx({
                    "col-6": true,
                    "pr-2": even,
                    "pl-2": odd,
                    "line__right-bottom": even,
                  })}
                >
                  <div className="work">
                    <div className="work-image">
                      <Image
                        src={w.image as any}
                        alt={w.name}
                        width={200}
                        height={200}
                      />
                      <span className="fa fa-image fa-lg"></span>
                    </div>
                    <h3 className="work-title">{w.name}</h3>
                    <p className="work-type">{w.type}</p>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default Works;
