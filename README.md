## Untabbed Chrome

### Motivation
Untabbed started as an idea some years ago: how do you visualize your browsing history in a way that persists across time and is useful in terms of semantics and relevance? It surprised me how little attention the 'tab problem' received. This iteration (and likely future ones) is implemented as a browser (Chrome) extension. The idea is a tab manager/ visualizer shouldn't itself be another tab. This first release includes features such as: semantic view, chronological view, bucket view, and even a to-do list feature.

Future releases will focus on getting semantic & chronological views right, as well as actually truncating users' tabs, and as such reducing their headaches. The idea is that you set and forget your browsing setings, and Untabbed basically takes care of culling old/ irrelevant tabs from your actual browser, while preserving that data in visual form up until it is no longer needed.

[Demo](https://youtu.be/Lljc_ONkzs0?si=BtuV-vOe9KESjh6V)

### Build instructions

1. Go to `src/lib/ai.ts`, replace the api_key with your own (the key shown is a restricted key and won't work for you).
2. From the root `npm i`, `npm run build`. This will produce a **dist** folder which we will use in the next steps.
3. You can then go to **Extensions** -> ** Manage Extensions** in your Chrome browser.
4.  Make sure `Developer Mode` is toggled on.
5.  Then proceed to **Load Unpacked**,specify the location of the **dist** folder what was created in step 2.
6.  Untabbed will be loaded!
