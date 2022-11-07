import { IWork } from "../types";
import EvianBliss from "../components/works/EvianBliss";
import Rodicash from "../components/works/Rodicash";
import Shopking from "../components/works/Shopking";
import ShopkingMobile from "../components/works/ShopkingMobile";

const works: IWork[] = [
  {
    id: "shopking-web",
    name: "Shopking",
    type: "Web",
    image: require("/public/images/works/shopking.png"),
    content: <Shopking />,
  },
  {
    id: "shopking-mobile",
    name: "Shopking",
    type: "Mobile",
    image: require("/public/images/works/shopking.png"),
    content: <ShopkingMobile />,
  },
  {
    id: "evianbliss",
    name: "Evian Bliss",
    type: "Web",
    image: require("/public/images/works/evianbliss.png"),
    content: <EvianBliss />,
  },
  {
    id: "rodicash",
    name: "Rodicash",
    type: "Mobile",
    image: require("/public/images/works/rodicash.png"),
    content: <Rodicash />,
  },
  {
    id: "myports",
    name: "MyPorts",
    type: "Mobile",
    image: require("/public/images/works/rodicash.png"),
    content: <EvianBliss />,
  },
];

export default works;
