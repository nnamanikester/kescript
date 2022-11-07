import create from "zustand";
import { IWork } from "../types";

interface WorkStore {
  work?: IWork;
  setWork: (work?: IWork) => void;
}

export const useWorkStore = create<WorkStore>((set) => ({
  work: undefined,
  setWork: (work) => {
    set({ work });
  },
}));
