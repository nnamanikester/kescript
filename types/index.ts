export type TabType = "Mobile" | "Web" | "All";

export interface IWork {
  id: number | string;
  name: string;
  type: TabType;
  image: NodeRequire;
  content: React.ReactNode;
}
