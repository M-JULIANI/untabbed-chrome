import { ViewMode } from "@/lib/types";
import React, { createContext, useContext, useState, ReactNode } from "react";

type HoveredContextType = {
  hovered: string;
  setHovered: (hovered: string) => void;
  selectedViewMode: ViewMode;
  setSelectedViewMode: (mode: ViewMode) => void;
};

const HoveredContext = createContext<HoveredContextType | undefined>(undefined);

const HoveredProvider = (props: { children: JSX.Element | JSX.Element[] }) => {
  const [hovered, setHovered] = useState<string>("");
  const [selectedViewMode, setSelectedViewMode] = useState<ViewMode>(ViewMode.Similarity);

  return (
    <HoveredContext.Provider value={{ hovered, setHovered, selectedViewMode, setSelectedViewMode }}>
      {props.children}
    </HoveredContext.Provider>
  );
};

export const useHovered = () => {
  const context = useContext(HoveredContext);
  if (!context) {
    throw new Error("useHovered must be used within a HoveredProvider");
  }
  return context;
};

export { HoveredContext, HoveredProvider };

//@ts-ignore
const ContextBridge = <T,>({ children, Context, render }: ContextBridgeProps<T>) => {
  return (
    <Context.Consumer>
      {(value: any) => render(<Context.Provider value={value}>{children}</Context.Provider>)}
    </Context.Consumer>
  );
};

import { Stage as PixiStage } from "@pixi/react";

//@ts-ignore
export const CustomStage = ({ children, ...props }) => {
  return (
    //@ts-ignore
    <ContextBridge Context={HoveredContext} render={(children) => <PixiStage {...props}>{children}</PixiStage>}>
      {children}
    </ContextBridge>
  );
};
