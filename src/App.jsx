import { useState, useEffect } from 'react'
import logo from './logo.svg'
import './App.css'
import { Stage, Container, Sprite, Text, Graphics } from '@pixi/react';
import { WebNode } from './components/WebNode'

function App() {
  const [results, setResults] = useState();
  const [dimensions, setDimensions] = useState({
    height: window.innerHeight,
    width: window.innerWidth,
  });

  useEffect(() => {
    function handleResize() {
      setDimensions({
        height: window.innerHeight,
        width: window.innerWidth,
      });
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  console.log('rendering')

  const stubData = [
    {
        "id": "1",
        "url": "https://theuselessweb.com/",
        "title": "The Useless Web",
        "parentId": null,
        "category": "Entertainment",
        "hostName": "theuselessweb.com"
    },
    {
        "id": "2",
        "url": "https://www.randomeower.com/",
        "title": "Randomeower",
        "parentId": null,
        "category": "General",
        "hostName": "randomeower.com"
    },
    {
        "id": "3",
        "url": "https://www.boredombusted.com/",
        "title": "Boredom Busted",
        "parentId": null,
        "category": "Entertainment",
        "hostName": "boredombusted.com"
    },
    {
        "id": "4",
        "url": "https://www.shuffleme.se/",
        "title": "ShuffleMe",
        "parentId": null,
        "category": "General",
        "hostName": "shuffleme.se"
    },
    {
        "id": "5",
        "url": "https://www.kaspersky.com/resource-center/threats/malware-examples",
        "title": "Types of Malware & Malware Examples",
        "parentId": null,
        "category": "Technology",
        "hostName": "kaspersky.com"
    },
    {
        "id": "6",
        "url": "https://www.knowledgelover.com/",
        "title": "Knowledge Lover",
        "parentId": null,
        "category": "Education",
        "hostName": "knowledgelover.com"
    },
    {
        "id": "7",
        "url": "https://www.goodreads.com/",
        "title": "Goodreads",
        "parentId": null,
        "category": "Books",
        "hostName": "goodreads.com"
    },
    {
        "id": "8",
        "url": "https://www.howstuffworks.com/",
        "title": "How Stuff Works",
        "parentId": null,
        "category": "Education",
        "hostName": "howstuffworks.com"
    },
    {
        "id": "9",
        "url": "https://www.codecademy.com/",
        "title": "Codecademy",
        "parentId": null,
        "category": "Education",
        "hostName": "codecademy.com"
    },
    {
        "id": "10",
        "url": "https://www.bbc.com/future",
        "title": "BBC Future",
        "parentId": null,
        "category": "News",
        "hostName": "bbc.com"
    },
    {
        "id": "11",
        "url": "https://99u.adobe.com/",
        "title": "99U",
        "parentId": null,
        "category": "Creativity",
        "hostName": "99u.com"
    },
    {
        "id": "12",
        "url": "https://www.fastcompany.com/",
        "title": "Fast Company",
        "parentId": null,
        "category": "Business",
        "hostName": "fastcompany.com"
    },
    {
        "id": "13",
        "url": "https://www.ehow.com/",
        "title": "eHow",
        "parentId": null,
        "category": "How To",
        "hostName": "ehow.com"
    },
    {
        "id": "14",
        "url": "https://www.powersearchingwithgoogle.com/",
        "title": "Power Searching With Google",
        "parentId": null,
        "category": "Education",
        "hostName": "powersearchingwithgoogle.com"
    },
    {
        "id": "15",
        "url": "https://www.makeuseof.com/",
        "title": "Make Use of",
        "parentId": null,
        "category": "Technology",
        "hostName": "makeuseof.com"
    },
    {
        "id": "16",
        "url": "https://www.quora.com/",
        "title": "Quora",
        "parentId": null,
        "category": "Q&A",
        "hostName": "quora.com"
    },
    {
        "id": "17",
        "url": "https://www.factslides.com/",
        "title": "Fact Slides",
        "parentId": null,
        "category": "Education",
        "hostName": "factslides.com"
    },
    {
        "id": "18",
        "url": "https://www.reddit.com/",
        "title": "Reddit",
        "parentId": null,
        "category": "Community",
        "hostName": "reddit.com"
    },
    {
        "id": "19",
        "url": "https://www.code.org/",
        "title": "Code.org",
        "parentId": null,
        "category": "Education",
        "hostName": "code.org"
    },
    {
        "id": "20",
        "url": "https://www.writersdigest.com/",
        "title": "Writer’s Digest",
        "parentId": null,
        "category": "Writing",
        "hostName": "writersdigest.com"
    }
]


  chrome?.storage?.onChanged.addListener((update) => {
    chrome?.storage?.sync.get(['mapKey'], (result) => {
      if (chrome.runtime.lastError) {
        // Handle the error, e.g., log it or show a message to the user
        console.log('error message')
        console.error(chrome.runtime.lastError.message);
      } else {
        const r = result['mapKey'] || [];
        console.log('initial results: ', { r })
        if (r) {
          const sortedResults = r.sort((a, b) => (a?.timeEnter || '').localeCompare((b?.timeEnter || '')))

          console.log({ sortedResults })

          const increment = window.innerHeight / sortedResults.length;
          const drawNodes = sortedResults.map((x, i) => {
            const xPos = Math.random() * window.innerWidth;
            return { x: xPos, y: i * increment, schema: { ...x } };
          })
          console.log({ drawNodes })

          setResults(drawNodes);
        }
      }
    })
  })

  console.log({ results })
  console.log({stubData})

  const draws = stubData.map((result, key) => {
    const xPos = Math.max(100, Math.min(window.innerWidth - 100, Math.random() * window.innerWidth));
    const yPos = Math.max(100, Math.min(window.innerHeight - 100, Math.random() * window.innerHeight));
      return { x: xPos, y: yPos, schema: { ...result } };
  });

  return (
    <Stage width={dimensions.width} height={dimensions.height} options={{ background: 0x1099bb }}>
      {draws && draws.map((result, key) => {
        return <WebNode key={result?.schema?.id || key} nodeInfo={result} radius={50} />
      })}
    </Stage>
  );
}
// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>Hello Vite + React!</p>
//         <p>
//           <button type="button" onClick={() => setCount((count) => count + 1)}>
//             count is: {count}
//           </button>
//         </p>
//         <p>
//           Edit <code>App.jsx</code> and save to test HMR updates.
//         </p>
//         <p>
//           <a
//             className="App-link"
//             href="https://reactjs.org"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             Learn React
//           </a>
//           {' | '}
//           <a
//             className="App-link"
//             href="https://vitejs.dev/guide/features.html"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             Vite Docs
//           </a>
//         </p>
//       </header>
//     </div>
//   )
// }

export default App
