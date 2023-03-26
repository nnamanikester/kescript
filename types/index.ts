export type TabType = "Mobile" | "Web" | "All";

export interface IWork {
  id: number | string;
  name: string;
  type: TabType;
  image: NodeRequire | string;
  content: React.ReactNode;
}

export interface IArticle {
  id: number | string;
  title: string;
  exerpt: string;
  image: NodeRequire;
  content: React.ReactNode;
  date: Date | string | number;
}
