import create from "zustand";
import { IArticle, IWork } from "../types";

interface ArticleStore {
  article?: IArticle;
  setArticle: (work?: IArticle) => void;
}

export const useArticleStore = create<ArticleStore>((set) => ({
  article: undefined,
  setArticle: (article) => {
    set({ article });
  },
}));
