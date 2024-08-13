import "./globals.css";
import "./App.css";
import { useState, useEffect, useRef, MouseEventHandler, useMemo, useCallback } from "react";
import { UMAP } from "umap-js";
import axios from "axios";
import TurndownService from "turndown";
import Prando from "prando";
import "@pixi/unsafe-eval";
import { Label } from "./components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Separator } from "./components/ui/separator";
import { DrawNode } from "./components/DrawNode";
import { cn } from "./lib/utils";
import { useToast } from "@/components/ui/use-toast";
import {
  isPointInsideRectangle,
  normalizePositions,
  remap,
  separateParticles,
  separateParticlesVertically,
} from "./lib/math";
import { BucketInfo, NodeInfo, PartialNodeInfo, ViewMode } from "./lib/types";
import {
  SIDE_GUTTER,
  DEFAULT_RADIUS,
  INDEXDB_NAME,
  INDEXDB_STORE,
  DB_VERSION,
  MAX_BUCKETS,
  generateGradientColors,
  bucket_prefix,
  todo_prefix,
  tabs_prefix,
} from "./lib/constants";
import { DrawBuckets } from "./components/DrawBuckets";
import debounce from "lodash/debounce";
import { BucketLegend } from "./components/BucketLegend";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./components/ui/card";
import { Switch } from "./components/ui/switch";
import { TodoItem, TodoList } from "./components/TodoList";
import { CustomStage, useHovered } from "./contexts/HoveredContext";
import { ViewModeMenu } from "./components/ViewModeMenu";

// const turndownService = new TurndownService();
const prng = new Prando(42);

export function fetchAllRecords(): Promise<any> {
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
const getCurrentHour = () => {
  const now = new Date();
  return now.getHours();
};
const storeDataWithTimestamp = (dataName: string, data: any) => {
  const currentHour = getCurrentHour();
  const key = `${dataName}-${currentHour}`;
  localStorage.setItem(key, JSON.stringify(data));
};
const getStoredData = (key: string) => {
  const item = localStorage.getItem(key);
  if (item) {
    return JSON.parse(item);
  }
  return null;
};

function App() {
  const [results, setResults] = useState<PartialNodeInfo[]>();
  const [dimensions, setDimensions] = useState({
    height: window.innerHeight,
    width: window.innerWidth,
  });
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingDrawing, setLoadingDrawing] = useState(false);

  const [selectedViewModeReady, setSelectedViewModeReady] = useState(true);
  const [localRecords, setLocalRecords] = useState<NodeInfo[]>([]);
  const [status, setStatus] = useState("");
  const neighborCount = [5];
  const [neighborCountReady, setNeighborCountReady] = useState(true);
  const minDistance = [0.002];
  const radiusDivisor = [15];
  const [minDistanceReady, setMinDistanceReady] = useState(true);
  const [radiusDivisorReady, setRadiusDivisorReady] = useState(true);
  const [resizeFlag, setResizeFlag] = useState(false);
  const ref = useRef(null);
  const [bounds, setBounds] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [tooltip, setTooltip] = useState({ visible: false, content: "", url: "", x: 0, y: 0, tabCount: 0 });
  const [calculated_radius, setCalculatedRadius] = useState(DEFAULT_RADIUS / (radiusDivisor[0] || 10));
  const [activeTabCount, setActiveTabCount] = useState(0);
  const [bucketNodes, setBucketNodes] = useState<BucketInfo[]>([]); // the nodes themselves, for drawing purposes
  const [todoListReady, setTodoListReady] = useState(false);
  const [settings, setSettings] = useState({
    tabs: { deduplicate: true, autoclose: true, daysAutoclose: "5" },
    todos: { maxListLength: "10", resurfaceCount: "3", closeOnComplete: true, email: { enabled: false, address: "" } },
  });
  const [todoList, setTodoList] = useState<TodoItem[]>([]);
  const { toast } = useToast();

  const { hovered, setHovered, selectedViewMode } = useHovered();
  const tfWorker = useMemo(() => new Worker(new URL("tf-worker.js", import.meta.url), { type: "module" }), []);
  const bucketWorker = useMemo(() => new Worker(new URL("bucket-worker.js", import.meta.url), { type: "module" }), []);
  let titleUrls: any;

  const delays = useMemo(() => bucketNodes.map((_, i) => Math.random() * 100), [bucketNodes.length]);

  useEffect(() => {
    if (results) {
      setCalculatedRadius(DEFAULT_RADIUS / (radiusDivisor[0] || 10));
    }
  }, [results, radiusDivisor]);

  const fetchDataAndPostMessage = async () => {
    const tabs = await loadTabs();
    if (tabs.length > 0) {
      setActiveTabCount(tabs.length);
    }

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

      const titleUrlPairs = simplifiedTabs.map((tab) => {
        return { title: tab.title, url: tab.url };
      });
      titleUrls = titleUrlPairs;

      console.log("Sending tabs w/ text:", simplifiedTabs);
      tfWorker.postMessage({
        operation: "processTabs",
        data: simplifiedTabs,
      });
    }
  };

  const initializeAll = useCallback(() => {
    setLoading(true);
    setStatus("Loading tabs...");
    fetchDataAndPostMessage();

    tfWorker.onmessage = function (e) {
      const { result } = e.data;
      console.log("Result from TensorFlow.js computation:", result);

      bucketWorker.postMessage({
        operation: "bucketTabs",
        //@ts-ignore
        data: titleUrls,
        windowInnerWidth: window.innerWidth,
        windowInnerHeight: window.innerHeight,
      });

      toast({
        title: "Buckets.",
        description: `Working on buckets...`,
      });

      setDataLoaded(true);
      setStatus("Tabs loaded....");
    };

    bucketWorker.onmessage = function (e) {
      const { value, type } = e.data;
      console.log("bucketWorker.onmessage: " + type);
      if (type === "buckets") {
        console.log("Result bucket-worker:", value);
        const result = value;

        if (result == null) {
          toast({
            title: "Buckets failed.",
            description: `failed to load bucket data`,
          });
          return;
        }

        setBucketNodes(result);
        storeDataWithTimestamp(bucket_prefix, result);
        setLoading(false);
        setStatus("");

        toast({
          title: "Buckets loaded.",
          description: `'Bucket' view mode now available!`,
        });

        bucketWorker.postMessage({
          operation: "todoList",
          data: titleUrls,
        });
      } else if (type === "todo") {
        const result = value;

        if (result == null) {
          toast({
            title: "Todo list failed.",
            description: `failed to load todo list`,
          });
          return;
        }
        setLoading(false);
        setTodoList(result);
        storeDataWithTimestamp(todo_prefix, result);
        setStatus("");
        setTodoListReady(true);
        toast({
          title: "Today's to-do list is ready!",
          description: `Open to-do tab to view it.`,
        });
      }
    };
  }, [
    tfWorker,
    bucketWorker,
    titleUrls,
    fetchDataAndPostMessage,
    storeDataWithTimestamp,
    bucket_prefix,
    todo_prefix,
    toast,
  ]);

  useEffect(() => {
    const currentHour = getCurrentHour();
    const bucketsKey = `${bucket_prefix}-${currentHour}`;
    const todoKey = `${todo_prefix}-${currentHour}`;
    const storedBuckets = getStoredData(bucketsKey);
    const storedTodo = getStoredData(todoKey);

    if (storedBuckets && storedTodo) {
      setBucketNodes(storedBuckets);
      setTodoList(storedTodo);
      setDataLoaded(true);
      setTodoListReady(true);
      setLoading(false);
      setStatus("");
    } else {
      Object.keys(localStorage).forEach((storageKey) => {
        if (storageKey.startsWith(todo_prefix)) {
          localStorage.removeItem(storageKey);
        }
        if (storageKey.startsWith(bucket_prefix)) {
          localStorage.removeItem(storageKey);
        }
      });

      initializeAll();
    }

    const bucketsInterval = setInterval(initializeAll, 60 * 60 * 1000); // Reinitialize tabs + buckets once per hour

    return () => {
      clearInterval(bucketsInterval);
      tfWorker.terminate(); // Clean up
      bucketWorker.terminate();
    };
  }, []);

  useEffect(() => {
    const handleWorkerMessage = async (message: any) => {
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

  //runs mostly during REFETCHING
  useEffect(() => {
    const runAsync = async () => {
      const records = await fetchAllRecords();
      console.log("REFETCHED RECORDS DUE TO MISSING ENTRIES");
      if (records) {
        setLocalRecords(records);
        //@ts-ignore
        //  const minLastAccesses = records.map((x) => x.lastAccessed).reduce((a: any, b: any) => Math.min(a, b));
        //if (minLastAccesses) setMinLastAccessed(minLastAccesses);
        //@ts-ignore
        // const maxLastAccesses = records?.map((x) => x.lastAccessed).reduce((a: any, b: any) => Math.max(a, b));
        // if (maxLastAccesses) setMaxLastAccessed(maxLastAccesses);
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
    // if (dataLoaded && results && results.length > 0 && Math.abs(results.length - activeTabCount) > TAB_DELTA_ALLOWED) {
    const delta = Math.abs((results?.length || 0) - activeTabCount) ?? 0;
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
      if (records) {
        setLocalRecords(records);
        //@ts-ignore
        //const minLastAccesses = records.map((x) => x.lastAccessed).reduce((a: any, b: any) => Math.min(a, b));
        // if (minLastAccesses) setMinLastAccessed(minLastAccesses);
        //@ts-ignore
        // const maxLastAccesses = records?.map((x) => x.lastAccessed).reduce((a: any, b: any) => Math.max(a, b));
        //  if (maxLastAccesses) setMaxLastAccessed(maxLastAccesses);
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
      // if (selectedViewMode === ViewMode.Bucket) {
      //   return;
      // }
      setSelectedViewModeReady(false);
      setLoadingDrawing(true);
      runAsync().then(() => {
        setLoadingDrawing(false);
        setLoading(false);
      });
    }
  }, [neighborCountReady, minDistanceReady, radiusDivisorReady, resizeFlag, localRecords, selectedViewModeReady]);

  useEffect(() => {
    function handleResize() {
      setDimensions({
        height: window.innerHeight,
        width: window.innerWidth,
      });
      setResizeFlag(true);

      if (ref.current) {
        //@ts-ignore
        const rect = ref.current.getBoundingClientRect();
        setBounds({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
      }
    }

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (!selectedViewModeReady) setSelectedViewModeReady(true);
  }, [selectedViewMode]);

  const handleHoverChange = useCallback(
    debounce((hoveredId: string, tooltipData: any) => {
      setHovered(hoveredId);
      setTooltip(tooltipData);
    }, 300),
    [],
  );

  const onMouseMove: MouseEventHandler = (e) => {
    if (loading || loadingDrawing) return;
    const point = { x: e.clientX, y: e.clientY };
    // check if hovering polygon
    if (selectedViewMode !== ViewMode.Bucket && results) {
      const idx = checkHover(point, results);
      if (hovered !== idx) {
        const match = results?.find((r: any) => r.id === idx);
        if (match) {
          handleHoverChange(match.id, {
            visible: true,
            content: match?.title || "",
            url: match?.url || "",
            x: match.x,
            y: match.y,
          });
          return;
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
    if (selectedViewMode === ViewMode.Bucket && bucketNodes) {
      const bucketChildren = bucketNodes.map((bucketNode) => bucketNode.children).flat();
      const idx = checkHover(point, bucketChildren);
      if (hovered !== idx) {
        const match = bucketChildren?.find((r: any) => r.id === idx);
        if (match) {
          handleHoverChange(match.id, {
            visible: true,
            content: match?.title || "",
            url: match?.url || "",
            x: match.x,
            y: match.y,
          });
          return;
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

  const categoryColors = useMemo(() => {
    return generateGradientColors(bucketNodes.length);
  }, [bucketNodes]);

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
          <>
            <div className="flex justify-center py-2">
              <Tabs defaultValue="map" className="w-[400px]">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="map">Map</TabsTrigger>
                  <TabsTrigger disabled={!todoListReady} value="tasks">
                    To-do
                  </TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
                <TabsContent value="map" className="flex justify-center w-full">
                  <div style={{ position: "relative" }}>
                    <CustomStage
                      className="rounded-xl"
                      width={dimensions.width - SIDE_GUTTER * 0.25}
                      height={dimensions.height - SIDE_GUTTER * 0.25 - 30}
                      options={{ background: "#202025" }}
                      onMouseMove={onMouseMove}
                      onMouseDown={onMouseDown}
                    >
                      {selectedViewMode === ViewMode.Bucket && bucketNodes && bucketNodes.length > 0 && (
                        <DrawBuckets buckets={bucketNodes} categoryColors={categoryColors} delays={delays} />
                      )}
                      {selectedViewMode !== ViewMode.Bucket &&
                        results &&
                        results.map((result: PartialNodeInfo, key: number) => {
                          return <DrawNode key={result?.id || key} nodeInfo={result} />;
                        })}
                    </CustomStage>
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

                    <div className="popover-top-right flex flex-col gap-2 px-4 py-4">
                      <ViewModeMenu disabled={bucketNodes.length < 1} />
                      {selectedViewMode === ViewMode.Bucket && bucketNodes && bucketNodes.length > 0 && (
                        <div>
                          <BucketLegend
                            legendColors={categoryColors.slice(0, Math.min(MAX_BUCKETS, bucketNodes.length))}
                            categories={bucketNodes
                              .slice(0, Math.min(MAX_BUCKETS, bucketNodes.length))
                              .map((bucket) => bucket.title)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="tasks" className="tabs-content">
                  <TodoList todos={todoList} />
                </TabsContent>
                <TabsContent value="settings" className="tabs-content">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">Tab settings</CardTitle>
                      <CardDescription>Change tab settings.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <Switch
                          checked={settings.tabs.deduplicate}
                          onCheckedChange={() =>
                            setSettings((s) => ({ ...s, tabs: { ...s.tabs, deduplicate: !s.tabs.deduplicate } }))
                          }
                        />
                        <Label htmlFor="settings-deduplicate">Deduplicate tabs</Label>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Switch
                          checked={settings.tabs.autoclose}
                          onCheckedChange={() =>
                            setSettings((s) => ({ ...s, tabs: { ...s.tabs, autoclose: !s.tabs.autoclose } }))
                          }
                        />
                        <Label htmlFor="settings-autoclose">Autoclose tabs after</Label>
                        {settings.tabs.autoclose && (
                          <div className="flex items-center space-x-4">
                            <Select
                              value={settings.tabs.daysAutoclose}
                              onValueChange={(v) =>
                                setSettings((s) => ({ ...s, tabs: { ...s.tabs, daysAutoclose: v } }))
                              }
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="5" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectItem value="1">1</SelectItem>
                                  <SelectItem value="3">3</SelectItem>
                                  <SelectItem value="5">5</SelectItem>
                                  <SelectItem value="30">30</SelectItem>
                                  <SelectItem value="60">60</SelectItem>
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            <Label htmlFor="settings-autoclose-suffix">days</Label>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <Separator />
                    <CardHeader>
                      <CardTitle className="text-xl">To-do settings</CardTitle>
                      <CardDescription>Change to-do settings.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <Label htmlFor="max-todo-length-label">Max to-do list length: </Label>
                        <Select
                          value={settings.todos.maxListLength}
                          onValueChange={(v) => setSettings((s) => ({ ...s, todos: { ...s.todos, maxListLength: v } }))}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="6" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="3">3</SelectItem>
                              <SelectItem value="6">6</SelectItem>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="15">15</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Label htmlFor="resurface-tabs-label">Don't resurface to-do after it has been shown</Label>
                        <Select
                          value={settings.todos.resurfaceCount}
                          onValueChange={(v) =>
                            setSettings((s) => ({ ...s, todos: { ...s.todos, resurfaceCount: v } }))
                          }
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="3" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="3">3</SelectItem>
                              <SelectItem value="6">6</SelectItem>
                              <SelectItem value="9">9</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <Label htmlFor="resurface-tabs-label-suffix">times</Label>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Switch
                          checked={settings.todos.closeOnComplete}
                          onCheckedChange={() =>
                            setSettings((s) => ({
                              ...s,
                              todos: { ...s.todos, closeOnComplete: !s.todos.closeOnComplete },
                            }))
                          }
                        />
                        <Label htmlFor="close-on-complete">Close tab once to-do has been marked as done.</Label>
                      </div>
                    </CardContent>
                    {/* <CardFooter>
                      <Button>Save password</Button>
                    </CardFooter> */}
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </>
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
        position: { x: result.x + 25, y: result.y + 50 },
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
    const filteredIndeces = embeddings
      .map((x: any, i: number) => (x !== undefined ? i : -1))
      .filter((i: any) => i !== undefined);

    const nonNullEmbeddings = filteredIndeces.map((x: any, i: number) => embeddings[i]);
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
  const rawPositions = await tryVisualizeEmbeddings(records, nCount, minDist, viewMode);
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
    if (viewMode === ViewMode.Historical) {
      normalized = separateParticlesVertically(normalized, SIDE_GUTTER);
    }
    normalized = separateParticles(normalized.map((x: any) => ({ ...x, x: x.x, y: x.y }))) as PartialNodeInfo[];
    return normalized;
  }
  return undefined;
}

export default App;
