import { IWork } from "../types";
import EvianBliss from "../components/works/EvianBliss";
import Rodicash from "../components/works/Rodicash";
import Shopking from "../components/works/Shopking";
import ShopkingMobile from "../components/works/ShopkingMobile";

const works: IWork[] = [
  {
    id: "pickriders-mobile",
    name: "Pickriders",
    type: "Mobile",
    image: "https://i.imgur.com/ro4x0mW.png",
    content: <Shopking />,
  },
  {
    id: "pickriders-web",
    name: "Pickriders",
    type: "Web",
    image: "https://i.imgur.com/enbhE9f.png",
    content: <Shopking />,
  },
  {
    id: "shopking-web",
    name: "Shopking",
    type: "Web",
    image: "https://i.imgur.com/0g9RWVq.jpg",
    content: <Shopking />,
  },
  {
    id: "shopking-mobile",
    name: "Shopking",
    type: "Mobile",
    image: "https://i.imgur.com/f3MTrsQ.png",
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
    image: "https://i.imgur.com/KuLL5lb.png",
    content: <Rodicash />,
  },
];

export default works;
