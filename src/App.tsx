import "./globals.css";
import "./App.css";
import { useState, useEffect, useRef, MouseEventHandler, useMemo } from "react";
import { Stage, Container, Text, Graphics, Sprite } from "@pixi/react";
import { UMAP } from "umap-js";
import axios from "axios";
import TurndownService from "turndown";
import Prando from "prando";
import { useCallback } from "react";
import "@pixi/unsafe-eval";
// import { SliderDemo } from './SliderDemo'
import * as PIXI from "pixi.js";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./components/ui/sheet";
import { Button } from "./components/ui/button";
import { Label } from "./components/ui/label";
import { Input } from "./components/ui/inputs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { Separator } from "./components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./components/ui/accordion";
import { DropShadowFilter } from "@pixi/filter-drop-shadow";
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "./components/ui/menubar";
import { Slider } from "./components/ui/slider";
import { stubResults } from "./lib/data/stubResults";
import { stubResultsLarge } from "./lib/data/stubResultsLarge";
import { stubTabs } from "./lib/data/stubTabs";
import { DrawNode } from "./components/DrawNode";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./components/ui/tooltip";
import { cn } from "./lib/utils";
import { useToast } from "@/components/ui/use-toast";
import {
  createRadialArrangements,
  isPointInsideRectangle,
  normalizePositions,
  normalizePositions_,
  normalizePositionsOnly,
  remap,
  separateParticles,
  separateParticlesVertically,
} from "./lib/math";
import { BucketInfo, NavigationMode, NodeInfo, PartialNodeInfo, Particle, ViewMode } from "./lib/types";
import {
  SIDE_GUTTER,
  DEFAULT_RADIUS,
  INDEXDB_NAME,
  INDEXDB_STORE,
  DB_VERSION,
  TAB_DELTA_ALLOWED,
} from "./lib/constants";
import { makeBuckets } from "./lib/ai";
import { DrawBuckets } from "./components/DrawBuckets";
import debounce from "lodash/debounce";

const turndownService = new TurndownService();
const prng = new Prando(42);

function App() {
  const [results, setResults] = useState<PartialNodeInfo[]>();
  const [minLastAccessed, setMinLastAccessed] = useState(0);
  const [maxLastAccessed, setMaxLastAccessed] = useState(100);
  const [dimensions, setDimensions] = useState({
    height: window.innerHeight,
    width: window.innerWidth,
  });
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingDrawing, setLoadingDrawing] = useState(false);

  const [selectedViewMode, setSelectedViewMode] = useState(ViewMode.Bucket);
  const [selectedNavMode, setSelectedNavMode] = useState(NavigationMode.Semantic);
  const [selectedViewModeReady, setSelectedViewModeReady] = useState(true);
  const [stare, setStare] = useState(2); // Step 2
  const [localRecords, setLocalRecords] = useState<NodeInfo[]>([]);
  const [status, setStatus] = useState("");
  const [neighborCount, setNeighborCount] = useState([5]);
  const [neighborCountReady, setNeighborCountReady] = useState(true);
  const [minDistance, setMinDistance] = useState([0.002]);
  const [radiusDivisor, setRadiusDivisor] = useState([15]);
  const [minDistanceReady, setMinDistanceReady] = useState(true);
  const [radiusDivisorReady, setRadiusDivisorReady] = useState(true);
  const [resizeFlag, setResizeFlag] = useState(false);
  const ref = useRef(null);
  const [bounds, setBounds] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [hovered, setHovered] = useState<string>("");
  const [tooltip, setTooltip] = useState({ visible: false, content: "", url: "", x: 0, y: 0, tabCount: 0 });
  const [calculated_radius, setCalculatedRadius] = useState(DEFAULT_RADIUS / (radiusDivisor[0] || 10));
  const [activeTabCount, setActiveTabCount] = useState(0);
  const [bucketNodes, setBucketNodes] = useState<BucketInfo[]>([]); // the nodes themselves, for drawing purposes
  const { toast } = useToast();

  // Example of importing a worker in your application
  const tfWorker = new Worker(new URL("tf-worker.js", import.meta.url), { type: "module" });
  // const bucketWorker = new Worker(new URL("bucker-worker.js", import.meta.url), { type: "module" });

  useEffect(() => {
    if (results) {
      setCalculatedRadius(DEFAULT_RADIUS / (radiusDivisor[0] || 10));
    }
    toast({ title: "calculatedRadius", description: `calc-${calculated_radius}, divisor-${radiusDivisor[0]}` });
  }, [results, radiusDivisor]);

  useEffect(() => {
    const updateBounds = () => {
      if (ref.current) {
        //@ts-ignore
        const rect = ref.current.getBoundingClientRect();
        setBounds({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
      }
    };

    window.addEventListener("resize", updateBounds);
    updateBounds();

    return () => window.removeEventListener("resize", updateBounds);
  }, []);

  useEffect(() => {
    // can probably be run evertyime there's an event, because
    // the processing step is skipped in tfworker when it has already run
    async function fetchDataAndPostMessage() {
      const tabs = await loadTabs();
      if (tabs.length > 0) {
        setActiveTabCount(tabs.length);
      }
      //FOR LOCAL
      // const tabs = stubTabs;
      console.log("here...");
      console.log({ tabs });
      if (tabs.length < 1) {
        console.log("No tabs loaded.");
      } else {
        const simplifiedTabs = tabs.map((tab, index) => {
          return {
            id: tab.id,
            title: tab.title,
            url: tab.url,
            favIconUrl: tab.favIconUrl,
            lastAccessed: tab.lastAccessed,
            text: "",
          };
        });

        console.log("Sending tabs w/ text:", simplifiedTabs);
        tfWorker.postMessage({
          operation: "processTabs",
          data: simplifiedTabs,
        });
      }
    }

    console.log("loading tabs from APP");
    setLoading(true);
    setStatus("Loading tabs...");
    fetchDataAndPostMessage();

    tfWorker.onmessage = function (e) {
      const { result } = e.data;
      console.log("Result from TensorFlow.js computation:", result);
      setDataLoaded(true);
      setStatus("Tabs loaded....");
    };

    return () => tfWorker.terminate(); // Clean up
  }, []);

  useEffect(() => {
    const fetchBuckets = async () => {
      if (results) {
        const bbb = await makeBuckets(results);
        const mappedContent: { [k: string]: PartialNodeInfo[] } = {};
        Object.values(bbb).forEach((bucket: any) => {
          const { name, children } = bucket;
          mappedContent[name] = children.map((url: string) => {
            const match = results.find((result: PartialNodeInfo) => result.url === url);
            return match;
          });
        });

        const randomPos: Particle[] = [];

        const { minSize, maxSize } = Object.keys(mappedContent).reduce(
          (acc, bucketName: any) => {
            const children = mappedContent[bucketName];
            console.log({ children });
            const size = children?.length ?? 1;

            acc.minSize = Math.min(acc.minSize, size);
            acc.maxSize = Math.max(acc.maxSize, size);

            return acc;
          },
          { minSize: Infinity, maxSize: -Infinity },
        );

        const targetRange = { min: 50, max: 100 };

        Object.keys(mappedContent).forEach((bucketName: any) => {
          const children = mappedContent[bucketName];
          console.log({ children });
          const size = children?.length ?? 1;
          const randomX = Math.random();
          const randomY = Math.random();
          const rad = remap(size, minSize, maxSize, targetRange.min, targetRange.max);
          randomPos.push({ x: randomX, y: randomY, radius: rad });
        });

        const rawPositions = randomPos.map((x) => [x.x, x.y]);
        const normalized = normalizePositionsOnly(rawPositions, SIDE_GUTTER);
        const particles = normalized.map((x, i) => ({ ...randomPos[i], x: x.x, y: x.y }));
        const separatedParticles = separateParticles(particles, 1.05);

        const bucketNodes = Object.keys(mappedContent).map((bucketName: string, index: number) => {
          const childPositions = mappedContent[bucketName].map((x: PartialNodeInfo) => {
            const randX = Math.random();
            const randY = Math.random();
            const multi = 1;
            return {
              ...x,
              x: x.x + randX * multi,
              y: x.y + randY * multi,
              originalX: x.x + randX * multi,
              originalY: x.y + randY * multi,
            };
          });

          const updatedChildPositions = separateParticles(childPositions, 1) as PartialNodeInfo[];

          const bucketNode = {
            id: "bucket-" + bucketName,
            x: separatedParticles[index]?.x ?? 10,
            y: separatedParticles[index]?.y ?? 10,
            originalX: separatedParticles[index]?.x ?? 10,
            originalY: separatedParticles[index]?.y ?? 10,
            radius: randomPos[index]?.radius ?? 10,
            title: bucketName,
            url: "",
            favIconUrl: "",
            children: updatedChildPositions,
          };
          return bucketNode;
        });

        setBucketNodes(bucketNodes);
      }
    };

    fetchBuckets();
  }, [results]);
  //runs mostly during REFETCHING
  useEffect(() => {
    const runAsync = async () => {
      const records = await fetchAllRecords();
      console.log("REFETCHED RECORDS DUE TO MISSING ENTRIES");
      console.log({ records });
      if (records) {
        setLocalRecords(records);
        //@ts-ignore
        const minLastAccesses = records.map((x) => x.lastAccessed).reduce((a: any, b: any) => Math.min(a, b));
        if (minLastAccesses) setMinLastAccessed(minLastAccesses);
        //@ts-ignore
        const maxLastAccesses = records?.map((x) => x.lastAccessed).reduce((a: any, b: any) => Math.max(a, b));
        if (maxLastAccesses) setMaxLastAccessed(maxLastAccesses);
        const rec_length = records.length * 1.0 ?? 10; //TEMPORARY
        const rad = calculated_radius ?? 10;
        const particlesCopy = records.map((x: NodeInfo, i: number) => {
          const remapped = remap(i * 1.0, 0, rec_length, rad * 0.5, rad * 1.25);
          const newRad = remapped ?? 12;
          return { ...x, xOriginal: x.x, yOriginal: x.y, radius: newRad };
        });
        const normalizedPositions = await calculatePositionsFromEmbeddings(
          particlesCopy,
          neighborCount[0],
          minDistance[0],
          selectedViewMode,
        );

        setResults(normalizedPositions);
      }
    };
    console.log("possibly rerunning fetch...");
    console.log({ dataLoaded, results, activeTabCount });
    // if (dataLoaded && results && results.length > 0 && Math.abs(results.length - activeTabCount) > TAB_DELTA_ALLOWED) {
    const delta = Math.abs((results?.length || 0) - activeTabCount) ?? 0;
    console.log({ delta, results, activeTabCount });
    //only runs when results is not adequate
    if (
      dataLoaded &&
      (results === undefined || (results && results.length > 0 && Math.abs(results.length - activeTabCount) > 0))
    ) {
      setStatus("Fetching.......");
      setLoading(true);
      runAsync().then(() => {
        setLoading(false);
        setStatus("");
      });
    }
  }, [activeTabCount, dataLoaded, results, selectedViewMode]);

  //runs mostly during initialization
  useEffect(() => {
    const runAsync = async () => {
      const records = await fetchAllRecords();
      console.log("FETCHED RECORDS INITIAL");
      console.log({ records });
      if (records) {
        setLocalRecords(records);
        //@ts-ignore
        const minLastAccesses = records.map((x) => x.lastAccessed).reduce((a: any, b: any) => Math.min(a, b));
        if (minLastAccesses) setMinLastAccessed(minLastAccesses);
        //@ts-ignore
        const maxLastAccesses = records?.map((x) => x.lastAccessed).reduce((a: any, b: any) => Math.max(a, b));
        if (maxLastAccesses) setMaxLastAccessed(maxLastAccesses);
        const rec_length = records.length * 1.0; //TEMPORARY
        const rad = calculated_radius ?? 10;
        const particlesCopy = records.map((x: NodeInfo, i: number) => {
          const remapped = remap(i * 1.0, 0, rec_length, rad * 0.5, rad * 1.25);
          const newRad = remapped ?? 12;
          return { ...x, xOriginal: x.x, yOriginal: x.y, radius: newRad };
        });
        const normalizedPositions = await calculatePositionsFromEmbeddings(
          particlesCopy,
          neighborCount[0],
          minDistance[0],
          selectedViewMode,
        );
        setResults(normalizedPositions);
      }
    };

    if (dataLoaded) {
      setStatus("Positions......");
      // setDataLoaded(false)
      setLoading(true);
      runAsync().then(() => {
        setLoading(false);
        setStatus("");
      });
    }
  }, [dataLoaded]);

  useEffect(() => {
    console.log("data loaded: " + dataLoaded);
  }, [dataLoaded]);

  useEffect(() => {
    const runAsync = async () => {
      const rec_length = localRecords.length * 1.0 ?? 10; //TEMPORARY
      const rad = calculated_radius ?? 10;
      const particlesCopy = localRecords.map((x: NodeInfo, i: number) => {
        const remapped = remap(i * 1.0, 0, rec_length, rad * 0.5, rad * 1.25);
        const newRad = remapped ?? 12;
        return { ...x, xOriginal: x.x, yOriginal: x.y, radius: newRad };
      });
      const normalizedPositions = await calculatePositionsFromEmbeddings(
        particlesCopy,
        neighborCount[0],
        minDistance[0],
        selectedViewMode,
      );
      if (normalizedPositions) setResults(normalizedPositions);
    };

    if (localRecords.length > 0 && minDistanceReady) {
      //reset
      setMinDistanceReady(false);
      setLoadingDrawing(true);
      runAsync().then(() => {
        setLoadingDrawing(false);
        setLoading(false);
      });
    }
    if (localRecords.length > 0 && neighborCountReady) {
      //reset
      setNeighborCountReady(false);
      setLoadingDrawing(true);
      runAsync().then(() => {
        setLoadingDrawing(false);
        setLoading(false);
      });
    }
    if (localRecords.length > 0 && radiusDivisorReady) {
      //reset
      setRadiusDivisorReady(false);
      setLoadingDrawing(true);
      runAsync().then(() => {
        setLoadingDrawing(false);
        setLoading(false);
      });
    }
    if (localRecords.length > 0 && resizeFlag) {
      setResizeFlag(false);
      setLoadingDrawing(true);
      runAsync().then(() => {
        setLoadingDrawing(false);
        setLoading(false);
      });
    }

    if (localRecords.length > 0 && selectedViewModeReady) {
      console.log("rerunning WITH NEW VIEW MODE");
      setSelectedViewModeReady(false);
      setLoadingDrawing(true);
      runAsync().then(() => {
        setLoadingDrawing(false);
        setLoading(false);
      });
    }
  }, [neighborCountReady, minDistanceReady, radiusDivisorReady, resizeFlag, localRecords, selectedViewModeReady]);

  useEffect(() => {
    const handleWorkerMessage = async (message: any) => {
      console.log({ message });
      if (results) {
        if (message.type === "TAB_CREATED") {
          toast({
            title: "Tab CREATED",
            description: `${message.tabId}`,
          });

          const tab = {
            id: message.id,
            title: message.title,
            url: message.url,
            favIconUrl: message.favIconUrl,
            lastAccessed: message.lastAccessed,
            text: "",
          };
          //process single tab
          tfWorker.postMessage({
            operation: "processTabs",
            data: tab,
          });
          console.log(`Tab created with ID: ${message.tabId}`);
        } else if (message.type === "TAB_REMOVED") {
          setLoadingDrawing(true);
          setResults((r) => r?.filter((x) => x.id !== message.id));
          setLoadingDrawing(false);
          console.log(`Tab removed with ID: ${message.id}`);
          toast({
            title: "Tab REMOVED",
            description: `${message.id}`,
          });
        }
      }
    };

    chrome.runtime.onMessage.addListener(handleWorkerMessage);

    // Cleanup the listener on component unmount
    return () => {
      chrome.runtime.onMessage.removeListener(handleWorkerMessage);
    };
  }, [results]);

  useEffect(() => {
    function handleResize() {
      setDimensions({
        height: window.innerHeight,
        width: window.innerWidth,
      });
      setResizeFlag(true);
    }

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  async function getWebsiteTextFromUrl(url: string) {
    // let headers = {
    //   "Accept": 'text/html',
    //   "Content-Type": 'text/html',
    // }

    const updated_url = `http://localhost:5000/api?url=${url}`;
    let response = undefined;

    try {
      response = await axios.get(updated_url);
      // console.log('response:')
      // console.log({ response })
      const text = turndownService.turndown(response.data);
      console.log("xformed", { text });
      return text;
    } catch (error) {
      console.log(error);
      console.warn(`website ${url} not accessible`);
      return undefined;
    }
  }

  function fetchAllRecords(): Promise<any> {
    console.log("Opening IndexedDB:", INDEXDB_NAME);
    let request = indexedDB.open(INDEXDB_NAME, DB_VERSION);

    return new Promise((resolve, reject) => {
      request.onsuccess = function (event) {
        console.log("IndexedDB opened successfully");
        let db = (event.target as IDBOpenDBRequest)?.result;
        console.log("Starting transaction on store:", INDEXDB_STORE);
        let transaction = db.transaction(INDEXDB_STORE, "readonly");
        let objectStore = transaction.objectStore(INDEXDB_STORE);
        console.log("Fetching all records from store:", INDEXDB_STORE);

        let getAllRequest = objectStore.getAll();

        getAllRequest.onsuccess = function (event: any) {
          let records = event.target.result.map((record: any) => record);
          resolve(records);
        };

        getAllRequest.onerror = function (event) {
          console.error("Error fetching records:", event);
          reject("Database error: " + event);
        };
      };

      request.onerror = function (event) {
        console.error("IndexedDB open error:", event);
        reject("IndexedDB open error: " + event);
      };
    });
  }
  console.log({ results });
  console.log("loading: " + loading);

  useEffect(() => {
    if (!selectedViewModeReady) setSelectedViewModeReady(true);
  }, [selectedViewMode]);

  const onMouseMove: MouseEventHandler = (e) => {
    if (loading || loadingDrawing) return;
    const point = { x: e.clientX, y: e.clientY };

    // check if hovering polygon
    if (results) {
      const idx = checkHover(point, results);
      const idxb = checkHover(point, bucketNodes);
      console.log("over bucket: ", idxb);

      const handleHoverChange = debounce((hoveredId: string, tooltipData: any) => {
        setHovered(hoveredId);
        setTooltip(tooltipData);
      }, 200); // Adjust the debounce delay as needed

      const handleHoverBucket = debounce((hoveredId: string) => {
        setHovered(hoveredId);
      }, 200); // Adjust the debounce delay as needed

      if (idx !== "") {
        if (hovered !== idx) {
          const match = results.find((r: any) => r.id === idx);
          if (match) {
            handleHoverChange(match.id, {
              visible: true,
              content: match?.title || "",
              url: match?.url || "",
              tabCount: 0,
              x: match.x,
              y: match.y,
            });
            return;
          }
        }
      }
      if (idxb !== "") {
        if (hovered !== idxb) {
          const bucketMatch = bucketNodes.find((r: any) => r.id === idxb);
          if (bucketMatch) {
            handleHoverBucket(bucketMatch.id);
            return;
          }
        }
      }

      if (hovered !== "") {
        handleHoverChange("", {
          visible: false,
          content: "",
          url: "",
          tabCount: 0,
          x: e.clientX,
          y: e.clientY,
        });
      }
    }
  };

  //handle open tab
  const onMouseDown: MouseEventHandler = (e) => {
    if (loading || loadingDrawing) return;
    if (hovered) {
      const match = results?.find((r: any) => r.id === hovered);
      if (match) {
        console.log({ match });
        const matchNumber = Number(match.id);
        chrome.tabs.get(matchNumber, (tab) => {
          if (chrome.runtime.lastError) {
            console.log("CREATE");
            // If the tab doesn't exist, open a new tab with the URL
            chrome.tabs.create({ url: match.url, active: true }, (newTab) => {
              // Assuming you have a way to open the side panel via content script
              if (newTab.id) {
                // chrome.scripting.executeScript({
                //   target: { tabId: newTab.id },
                //   chrome.sidePanel.open({ tabId: tab.id });
                // });
                chrome.sidePanel.open({ tabId: newTab.id });
              }
            });
          } else {
            console.log("OPEN");
            // If the tab exists, make it active
            chrome.tabs.update(matchNumber, { active: true }, () => {
              // Bring the tab's window to the foreground
              if (tab.windowId) {
                chrome.windows.update(tab.windowId, { focused: true });
              }

              if (tab.id) {
                console.log("Executing script in existing tab:", tab.id);
                chrome.sidePanel.open({ tabId: tab.id });
              }
            });
          }
        });
      } else {
        console.log("no match");
      }
    }
  };

  useEffect(() => {
    toast({
      title: "view mode changed.",
      description: `${selectedViewMode}`,
    });
  }, [selectedViewMode]);

  return (
    <>
      {loading ? (
        <>
          <div
            style={{
              display: "flex",
              flexDirection: "column", // Stack the divs vertically
              justifyContent: "center",
              alignItems: "center",
              height: "100vh",
            }}
          >
            <div
              style={{
                fontSize: "72px",
              }}
              className="loading"
            >
              <span>u</span>
              <span>n</span>
              <span>t</span>
              <span>a</span>
              <span>b</span>
              <span>b</span>
              <span>e</span>
              <span>d</span>
            </div>
            <div className="chatbox">
              <div className="text">{status}</div>
            </div>
          </div>
        </>
      ) : (
        <>
          {loadingDrawing ? (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                zIndex: 2,
              }}
            >
              <div className="chatbox">
                <div className="text">
                  {activeTabCount > 99 ? `${activeTabCount} tabs.......` : `${activeTabCount} tabs........`}
                </div>
              </div>
            </div>
          ) : null}
          <div style={{ position: "relative" }}>
            <Stage
              width={dimensions.width}
              height={dimensions.height}
              options={{ background: "#202025" }}
              onMouseMove={onMouseMove}
              onMouseDown={onMouseDown}
            >
              {selectedViewMode === ViewMode.Bucket && bucketNodes && (
                <DrawBuckets buckets={bucketNodes} hovered={hovered} />
              )}
              {selectedViewMode !== ViewMode.Bucket &&
                results &&
                results.map((result: PartialNodeInfo, key: number) => {
                  return <DrawNode key={result?.id || key} nodeInfo={result} hovered={hovered} />;
                })}
            </Stage>
            {tooltip.visible && (
              <div
                style={{
                  position: "absolute",
                  left: tooltip.x,
                  top: tooltip.y,
                  padding: "5px",
                  background: "red",
                  border: "1px solid black",
                  borderRadius: "5px",
                  pointerEvents: "none", // Prevents the tooltip from interfering with mouse events
                  transform: `translate(-50%, -${calculated_radius + 20}px)`, // Adjusts the position to be above the cursor
                  whiteSpace: "nowrap",
                }}
                className={cn(
                  "z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                )}
              >
                <div className="flex-col">
                  <div
                    style={{
                      fontWeight: "bold",
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      maxWidth: "200px",
                    }}
                  >
                    {tooltip.content}
                  </div>
                  <div
                    style={{
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      maxWidth: "200px",
                    }}
                  >
                    {tooltip.url || tooltip.tabCount + " tabs"}
                  </div>
                </div>
              </div>
            )}

            <div className="popover-top-right flex flex-col gap-2 px-8 py-4" style={{ margin: "10px 20px" }}>
              <Menubar className="outline-menu" style={{ outlineColor: "#E9E9E9" }}>
                <MenubarMenu>
                  <MenubarTrigger className="hover:bg-transparent active:bg-transparent" style={{ color: "#E9E9E9" }}>
                    View Mode
                  </MenubarTrigger>
                  <MenubarContent>
                    <MenubarCheckboxItem
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
                      Historical
                    </MenubarCheckboxItem>
                    {selectedViewMode !== ViewMode.Bucket && (
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
                    )}
                  </MenubarContent>
                </MenubarMenu>
                <MenubarMenu>
                  <MenubarTrigger className="hover:bg-transparent active:bg-transparent" style={{ color: "#E9E9E9" }}>
                    Settings
                  </MenubarTrigger>
                  <MenubarContent>
                    <MenubarRadioGroup value="benoit">
                      <MenubarRadioItem value="andy">Andy</MenubarRadioItem>
                      <MenubarRadioItem value="benoit">Benoit</MenubarRadioItem>
                      <MenubarRadioItem value="Luis">Luis</MenubarRadioItem>
                    </MenubarRadioGroup>
                    <MenubarSeparator />
                    <MenubarItem inset>Edit...</MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem inset>Add Profile...</MenubarItem>
                  </MenubarContent>
                </MenubarMenu>
                <MenubarMenu>
                  <MenubarTrigger className="hover:bg-transparent active:bg-transparent" style={{ color: "#E9E9E9" }}>
                    Analytics
                  </MenubarTrigger>
                  <MenubarContent>
                    <MenubarRadioGroup value="benoit">
                      <MenubarRadioItem value="andy">Andy</MenubarRadioItem>
                      <MenubarRadioItem value="benoit">Benoit</MenubarRadioItem>
                      <MenubarRadioItem value="Luis">Luis</MenubarRadioItem>
                    </MenubarRadioGroup>
                    <MenubarSeparator />
                    <MenubarItem inset>Edit...</MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem inset>Add Profile...</MenubarItem>
                  </MenubarContent>
                </MenubarMenu>
              </Menubar>
            </div>
          </div>
        </>
      )}
    </>
  );
}

const checkHover = (point: { x: number; y: number }, results: (PartialNodeInfo | BucketInfo)[]) => {
  let isHovering: string = "";
  results?.forEach((result: any) => {
    if (
      isPointInsideRectangle(point, {
        position: { x: result.x, y: result.y },
        length: result?.radius || 1,
        height: result?.radius || 1,
      })
    ) {
      isHovering = result.id || "";
      return;
    }
  });
  return isHovering;
};

async function loadTabs() {
  const tabs: any[] = [];
  const windowList = await new Promise<any[]>((resolve) => {
    chrome.windows.getAll({ populate: true }, function (windows) {
      resolve(windows);
    });
  });

  windowList.forEach((window) => {
    window.current = false;
    window.focused = false;
    window.tabs.forEach((tab: any) => {
      tabs.push(tab);
    });
  });

  return tabs;
}

async function tryVisualizeEmbeddings(records: any, nNeighbors: number, minDist: number, viewMode: ViewMode) {
  if (!records) undefined;
  const results = await visualizeEmbeddings(records, nNeighbors, minDist, viewMode);

  if (results !== undefined) {
    return results;
  } else {
    console.log("retrying with fewer neighbors... " + (nNeighbors - 1));
    if (nNeighbors > 1) {
      return await tryVisualizeEmbeddings(records, nNeighbors - 1, minDist, viewMode);
    } else {
      return undefined;
    }
  }
}

async function visualizeEmbeddings(records: any, nNeighbors: number, minDist: number, viewMode: ViewMode) {
  try {
    //@ts-ignore
    const embeddings = records.map((x) => x.embedding);
    console.log({ records, embeddings });
    const filteredIndeces = embeddings
      .map((x: any, i: number) => (x !== undefined ? i : -1))
      .filter((i: any) => i !== undefined);

    const nonNullEmbeddings = filteredIndeces.map((x: any, i: number) => embeddings[i]);
    console.log({ nonNullEmbeddings });
    //const nonNullEmbeddings = filteredIndeces.map((x: any, i: number) => embeddings[i][0]); // Assuming extra array wrappin
    const umap = new UMAP({
      nNeighbors: records.length >= 5 ? nNeighbors : 0,
      random: () => prng.next(),
      minDist,
      nComponents: viewMode === ViewMode.Similarity ? 2 : 1,
    });
    let positions;
    if (records.length < 5) {
      // Provide default positions or handle the case appropriately
      positions = records.map((r: any, i: number) => [10 + i, 10]); // Example default positions
    } else {
      positions = await umap.fitAsync(nonNullEmbeddings);
    }
    const updatedPositions = positions.map((x: any) => {
      x[0] = (x[0] ?? 0) || 10;
      x[1] = (x[1] ?? 0) || 10;
      return x;
    });
    console.log({ positions, updatedPositions });

    return { positions: updatedPositions, ids: filteredIndeces };
  } catch (error) {
    console.log("error in visualizeEmbeddings");
    console.log(error);
    return undefined;
  }
}

async function calculatePositionsFromEmbeddings(
  records: NodeInfo[],
  nCount: number,
  minDist: number,
  viewMode: ViewMode,
) {
  console.log("about to visualize embeddings");
  console.log({ records });
  const rawPositions = await tryVisualizeEmbeddings(records, nCount, minDist, viewMode);
  console.log("raw positions");
  console.log({ rawPositions });
  if (rawPositions !== undefined) {
    const partialNodeInfo: PartialNodeInfo[] = records.map((nodeInfo) => ({
      x: nodeInfo.x,
      y: nodeInfo.y,
      originalX: nodeInfo.x,
      originalY: nodeInfo.y,
      id: nodeInfo.id,
      favIconUrl: nodeInfo.favIconUrl,
      radius: nodeInfo.radius,
      title: nodeInfo.title,
      url: nodeInfo.url,
    }));
    let normalized = normalizePositions(rawPositions.positions, rawPositions.ids, partialNodeInfo, SIDE_GUTTER);
    normalized = separateParticles(normalized.map((x: any) => ({ ...x, x: x.x, y: x.y }))) as PartialNodeInfo[];
    if (viewMode === ViewMode.Historical) {
      normalized = separateParticlesVertically(normalized, SIDE_GUTTER);
    } else if (viewMode === ViewMode.Concentric) {
      normalized = createRadialArrangements(normalized, SIDE_GUTTER);
    }

    console.log("normalized particle positions");
    console.log({ normalized });
    return normalized;
  }
  return undefined;
}

export default App;
