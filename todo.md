- [x] get pipeline working with stub data
    - [x] get text from url
    - [x] get embedding from text
    - [x] get 2d position from embedding
    - [x] draw all positions on the canvas
- [ ] investigate why i am getting different layouts on refresh, maybe try specifying a specific seed for a more deterministic behavior
- [ ] grab all open tabs

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
- [ ] cron job
    - check number of entries, delete any in excess of X from db every day
- [ ] canvas
    - [ ] onHover
        - metadata
    - [ ] onClick
        - goto?
- [ ] settings
    - collapse all windows
    - display all windows
- [ ] views:
    - clustered by semantics
    - clustered (1d) by semantics, and chronological


    - radius by visits
    - color by? 
        - category?
        - random gradient?

- [ ] considerations
    - deduplication
