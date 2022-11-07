import { IArticle } from "../types";
import DefaultArticle from "../components/articles/default-article";

const articles: IArticle[] = [
  {
    id: "things-you-need-to-know-about-react",
    title: "Things you need to know about react",
    exerpt:
      "Ex audire suavitate has, ei quodsi tacimates sapientem sed, pri zril ubique ut. Te cule tation munere noluisse. Enim torquatos",
    image: require("/public/images/works/shopking.png"),
    content: <DefaultArticle />,
    date: new Date(),
  },
  {
    id: "react-native-best-practices",
    title: "React Native best practices",
    exerpt:
      "Ex audire suavitate has, ei quodsi tacimates sapientem sed, pri zril ubique ut. Te cule tation munere noluisse. Enim torquatos",
    image: require("/public/images/works/shopking.png"),
    content: <DefaultArticle />,
    date: new Date(),
  },
  {
    id: "functional-vs-class-components",
    title: "Functional VS Class Components",
    exerpt:
      "Ex audire suavitate has, ei quodsi tacimates sapientem sed, pri zril ubique ut. Te cule tation munere noluisse. Enim torquatos",
    image: require("/public/images/works/shopking.png"),
    content: <DefaultArticle />,
    date: new Date(),
  },
  {
    id: "build-expo-app-using-eas",
    title: "Building Expo app using EAS",
    exerpt:
      "Ex audire suavitate has, ei quodsi tacimates sapientem sed, pri zril ubique ut. Te cule tation munere noluisse. Enim torquatos",
    image: require("/public/images/works/shopking.png"),
    content: <DefaultArticle />,
    date: new Date(),
  },
];

export default articles;
