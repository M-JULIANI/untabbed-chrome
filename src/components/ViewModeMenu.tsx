import { BucketInfo, ViewMode } from "@/lib/types";
import { Menubar, MenubarCheckboxItem, MenubarContent, MenubarMenu, MenubarTrigger } from "./ui/menubar";
import { useHovered } from "@/contexts/HoveredContext";

export const ViewModeMenu = ({ disabled }: { disabled: boolean }) => {
  const { selectedViewMode, setSelectedViewMode } = useHovered();
  return (
    <Menubar className="outline-menu" style={{ outlineColor: "#E9E9E9" }}>
      <MenubarMenu>
        <MenubarTrigger className="hover:bg-transparent active:bg-transparent" style={{ color: "#E9E9E9" }}>
          <div>View Mode</div>
        </MenubarTrigger>
        <MenubarContent>
          <MenubarCheckboxItem
            disabled={disabled}
            onClick={() => setSelectedViewMode(ViewMode.Bucket)}
            checked={selectedViewMode === ViewMode.Bucket}
          >
            Bucket
          </MenubarCheckboxItem>
          <MenubarCheckboxItem
            onClick={() => setSelectedViewMode(ViewMode.Similarity)}
            checked={selectedViewMode === ViewMode.Similarity}
          >
            Semantic
          </MenubarCheckboxItem>
          <MenubarCheckboxItem
            onClick={() => setSelectedViewMode(ViewMode.Historical)}
            checked={selectedViewMode === ViewMode.Historical}
          >
            Chronological
          </MenubarCheckboxItem>
          {/* {selectedViewMode !== ViewMode.Bucket && (
          <>
            <MenubarSeparator />
            <div className="flex flex-col justify-between gap-6 my-4 ml-8">
              <div className="grid grid-cols-2 items-center gap-4 mr-8">
                <Label htmlFor="width">Distance</Label>
                <Slider
                  className={"flex-grow"}
                  min={0.001}
                  defaultValue={minDistance}
                  step={0.001}
                  max={1.0}
                  onValueChange={(v) => setMinDistance(v)}
                  onBlur={(v) => {
                    setMinDistanceReady(true);
                  }}
                />
              </div>
              <div className="grid grid-cols-2 items-center gap-4 mr-8">
                <Label htmlFor="width">Neighbors</Label>
                <Slider
                  className={"flex-grow"}
                  min={3}
                  defaultValue={neighborCount}
                  step={1}
                  max={20}
                  onValueChange={(v) => setNeighborCount(v)}
                  onBlur={(v) => {
                    setNeighborCountReady(true);
                  }}
                />
              </div>
              <div className="grid grid-cols-2 items-center gap-4 mr-8">
                <Label htmlFor="width">Radius Divisor</Label>
                <Slider
                  className={"flex-grow"}
                  min={10}
                  defaultValue={radiusDivisor}
                  step={1}
                  max={20}
                  onValueChange={(v) => setRadiusDivisor(v)}
                  onBlur={(v) => {
                    setRadiusDivisorReady(true);
                  }}
                />
              </div>
            </div>
          </>
        )} */}
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
};
