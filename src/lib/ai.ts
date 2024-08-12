import { GoogleGenerativeAI } from "@google/generative-ai";

//This is a restricted key, to get the app running properly, you need to replace it with your own key.
const key = "AIzaSyB7ms-PCXtocSL1q0UakwvtR26YRuDmSmM";
const genAI = new GoogleGenerativeAI(key);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

export const makeBuckets = async (titleUrlPairs: { title: string; url: string }[]) => {
  // console.log("making buckets...");
  if (titleUrlPairs.length === 0) {
    return { response: "none" };
  }

  const prompt = `
  Take the following website title/url pairs, and generate anywhere between 3-10 bucket categories that best describe the data. 
  The level of granularity for each bucket category depends on the specificity and range of the dataset. 
  Avoid creating buckets with only one or two items in them; instead, use a 'Miscellaneous' or 'Other' category for those. 
  Ensure that there are never more than 10 buckets returned. 
  Once the buckets have been created, return a JSON response object that contains each bucket as an object with a "name" field for the bucket name 
  and a "children" field containing an array of the urls belonging to that bucket.

  ## Website title/url pairs:
  ${JSON.stringify(titleUrlPairs, null, 2)}
  
  Use this JSON schema:
  {
    "name": "Name of bucket 1",
    "children": ["url 1", "url 2", "url 3"]
  }

`;

  const result = await model.generateContent(prompt);
  const res = result.response.text();
  const cleaned = removeJsonTags(res);
  const parsed = JSON.parse(cleaned);
  return parsed;
};

export const makeBucketsWithRetry = async (titleUrlPairs: { title: string; url: string }[]) => {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      return await makeBuckets(titleUrlPairs);
    } catch (error: unknown) {
      attempts++;
      const err = error as Error;
      console.error(`Attempt ${attempts} failed: ${err.message}`);
      if (attempts >= maxAttempts) {
        throw new Error(`Failed to parse JSON after ${maxAttempts} attempts`);
      }
    }
  }
};

function removeJsonTags(input: string): string {
  // Use a regular expression to remove the ```json``` tags
  const cleanedString = input.replace(/```json\s*([\s\S]*?)\s*```/, "$1").trim();
  return cleanedString;
}

//this will be augmented to include more context for better results
export const makeTodoList = async (titleUrlPairs: { title: string; url: string }[]) => {
  if (titleUrlPairs.length === 0) {
    return { response: "none" };
  }

  const prompt = `
  From the provided website title/url pairs, select up to 10 to translate into actionable to-do items. Do not simply use the titles as to-do items. Instead, consider why a user might have these tabs open and create meaningful to-do actions based on that context. Remember, not every tab will translate into a to-do action.

  Example: 
  - If a recipe website is open, the to-do item might be "Cook the recipe".
  - If a ticketing website is open, the to-do item might be "Book tickets".

  Return a JSON response with each to-do item as an object with these fields:
  {
    "text": string;
    "description": string;
    "url": string;
    "priority": 1 | 2 | 3;
    "done": boolean;
    "notes": string;
  }

  ## Website title/url pairs:
  ${JSON.stringify(titleUrlPairs, null, 2)}
`;

  const result = await model.generateContent(prompt);

  console.log("result text or json");
  const res = result.response.text();
  console.log("res: ");
  console.log({ res });

  const cleaned = removeJsonTags(res);

  const parsed = JSON.parse(cleaned);
  console.log("parsed: ");
  console.log({ parsed });
  return parsed;
};

export const makeTodoListWithRetry = async (titleUrlPairs: { title: string; url: string }[]) => {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      return await makeTodoList(titleUrlPairs);
    } catch (error: unknown) {
      attempts++;
      const err = error as Error;
      console.error(`Attempt ${attempts} failed: ${err.message}`);
      if (attempts >= maxAttempts) {
        throw new Error(`Failed to parse JSON after ${maxAttempts} attempts`);
      }
    }
  }
};
