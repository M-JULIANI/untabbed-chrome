import { makeBuckets } from "./lib/ai"

self.onmessage = async (e) => {
    console.log('Bucket Worker: Message received from main script');
    const operation = e.data.operation;
    const tabs = e.data.data
    try {
        if (operation === 'bucketTabs') {
            await loadTFModel();
            console.log('EEEENTERING>>>>>')
            console.log('seeding the db...')
            await initializeDatabase();
            const tabHandler = new TabHandler();
            console.log('tabs to process... ' + tabs.length)
            await tabHandler.processTabs(tabs);
            console.log('TensorFlow.js version:', tf.version.tfjs);
            self.postMessage({ result: 'Computation done' });
        }
    } catch (error) {
        console.log('error in worker: ')
        console.log(error)
    }
};

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