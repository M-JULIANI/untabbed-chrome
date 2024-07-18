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
- [ ] event listener
    - tab open
        - handler
            -> update db
    - tab closed
        - handler
            - -> update db
- [x] get default display settings working well
- [x] animate between positions
- [ ] cron job
    - check number of entries, delete any in excess of X from db every day
- [ ] canvas
    - [x] onHover
        -[x]  title & url
    - [ ] onClick
        - goto?
    - [ ] display:
        - [ ] radius by visits/last accessed
    - [ ] color by? 
        - [ ] category?
        - [ ] random gradient?
- [ ] settings
    - collapse all windows
    - display all windows
- [ ] views:
    - semantics 2d
    - concentric 1d
    - chronological 1d

- [ ] considerations
    - deduplication
