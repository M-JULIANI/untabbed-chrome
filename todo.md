- [x] get pipeline working with stub data
    - [x] get text from url
    - [x] get embedding from text
    - [x] get 2d position from embedding
    - [x] draw all positions on the canvas
- [x] investigate why i am getting different layouts on refresh, maybe try specifying a specific seed for a more deterministic behavior
- [x] grab all open tabs

- [ ] get service-worker or content pages working
<!-- - [ ] get the 'pipeline' to initialize when the extension in active
- [ ] get 'listener' to listen for tab activity (open/closed) while extension active -->

'tab activity'
---------------

schema:
    key: url
    embedding: [...]
    lastOpened: date
    lastVisited: date
    active: open | closed //only surfaced 'opened'
    visited: number // times opened total

system:

- [ ] improved architecture: service worker to listen to CUD events, and pass them to APP
    - [ ] on remove: remove entry from db, filter resuts in app
    - [ ] on add: add entry to db, pass message on to app for processing
    - [ ] on update: think about this more...
- [ ] caching of localRecords 
- [x] get default display settings working well
- [x] animate between positions
- [ ] create kmeans clusters
- [ ] make groups, of similar tabs
- [ ] cron job
    - [ ] check number of entries, delete any in excess of X from db every day
- [ ] canvas
    - [x] onHover
        -[x]  title & url
    - [x] onClick
        - [x] goto tab/window?
        - [x] open untabbed side panel on the right?
    - [ ] display:
        - [ ] radius by visits/last accessed
    - [ ] color by? 
        - [ ] category?
        - [ ] random gradient?
- [ ] settings
    - [ ] collapse all windows
    - [ ] display all windows
- [ ] views:
    - [x] semantics 2d
    - [ ] concentric 1d
    - [ ] chronological 1d

- [ ] considerations
    - deduplication
