import { GoogleGenerativeAI } from "@google/generative-ai";

const key = "AIzaSyB7ms-PCXtocSL1q0UakwvtR26YRuDmSmM";
const genAI = new GoogleGenerativeAI(key);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

export const makeBuckets = async (records: any[]) => {
  // console.log("making buckets...");
  if (records.length === 0) {
    return { response: "none" };
  }
  const titles = records.map((x) => ({ title: x.title, url: x.url }));
  // console.log("titles: ", titles);
  const prompt = `
    Take the following website title/url pairs, and generate anywhere between 3-10 bucket categories that best describe the data. 
    The level of granularity for each bucket category depends on the specificity and range of the dataset. 
    Once the buckets have been created, return a JSON response object that contains each bucket as an object with a "name" field for the bucket name 
    and a "children" field containing an array of the urls belonging to that bucket.

    ## Website title/url pairs:
    ${JSON.stringify(titles, null, 2)}
    
    Use this JSON schema:
    {
      "name": "Name of bucket 1",
      "children": ["url 1", "url 2", "url 3"]
    }

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

function removeJsonTags(input: string): string {
  // Use a regular expression to remove the ```json``` tags
  const cleanedString = input.replace(/```json\s*([\s\S]*?)\s*```/, "$1").trim();
  return cleanedString;
}
