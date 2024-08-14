## Untabbed Chrome

Adding basic build instructions in case it isn't obvious.

### Build instructions

1. Go to `src/lib/ai.ts`, replace the api_key with your own (the key shown is a restricted key and won't work for you).
2. From the root `npm i`, `npm run build`. This will produce a **dist** folder which we will use in the next steps.
3. You can then go to **Extensions** -> ** Manage Extensions** in your Chrome browser.
4.  Make sure `Developer Mode` is toggled on.
5.  Then proceed to **Load Unpacked**,specify the location of the **dist** folder what was created in step 2.
6.  Untabbed will be loaded!
