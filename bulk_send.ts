import { sendMessage, sendText, Response } from "./sendMessage";
import DynamoDB from "aws-sdk/clients/dynamodb";
import generateBarcode from "./generateBarcode";
import { DateTime, DurationUnit } from "luxon";

const dynamo = new DynamoDB.DocumentClient({
  region: "us-east-1",
});

interface Pleb {
  name?: string;
  id: string;
}

async function plebs(): Promise<Pleb[]> {
  return [
    {
      id: "1661231673922555",
      name: "Kane",
    },
    {
      id: "1849045348502451",
      name: "Nelson",
    },
    {
      id: "1624867974299823",
      name: "Brian",
    },
    {
      id: "1857252931016399",
      name: "Mei",
    },
  ];
}

async function haters(): Promise<string[]> {
  const result = await dynamo
    .scan({
      TableName: "Feedback",
      FilterExpression: "#t=:i and #p=:n",
      ExpressionAttributeNames: {
        "#t": "type",
        "#p": "payload",
      },
      ExpressionAttributeValues: {
        ":i": "FOOD_RATING",
        ":n": "0",
      },
      ProjectionExpression: "psid",
    })
    .promise();

  return result.Items.map(i => i.psid);
}

async function peasants(): Promise<Pleb[]> {
  const dates = ["2018-08-07", "2018-08-20"].map(d => DateTime.fromISO(d));
  const result = await dynamo
    .scan({
      TableName: "Conversations",
      ProjectionExpression: "#n,psid,createdAt",
      ExpressionAttributeNames: {
        "#n": "name",
      },
      // FilterExpression:
      //   // "begins_with (createdAt, :one) OR begins_with (createdAt, :two) OR begins_with (createdAt, :three) OR begins_with (createdAt, :four)",
      //   "begins_with (createdAt, :one)",
      // ExpressionAttributeValues: {
      //   ":one": "2018-05-17",
      //   // ":two": "2018-04-17",
      //   // ":three": "2018-03-29",
      //   // ":four": "2018-03-08",
      // },
    })
    .promise();

  console.log("Items before filter", result.Items.length);

  return result.Items.filter(i => {
    if (!i.createdAt) return false;
    const date = DateTime.fromMillis(i.createdAt);
    return date.hasSame(dates[0], "day") || date.hasSame(dates[1], "day");
  }).map(i => ({
    id: i.psid,
    name: i.name,
  }));
}

async function sendNuggets({ id, name }: Pleb): Promise<void> {
  console.log("Sending to", id, name);
  const fixedName = name ? name.toUpperCase() : "FAM";
  const response: Response = {
    recipient: {
      id,
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          image_aspect_ratio: "square",
          template_type: "generic",
          elements: [
            {
              title: `Come sample some LOTF burgers, ${fixedName}! 🍔`,
              image_url:
                "https://cdn0.woolworths.media/content/wowproductimages/large/937534.jpg",
              subtitle: `beloved nuggets are just THREE BUCKS TODAY ONLY`,
              default_action: {
                type: "web_url",
                url: "http://bit.ly/3bucknugs",
                webview_height_ratio: "tall",
              },
              buttons: [
                {
                  type: "web_url",
                  url: "http://bit.ly/3bucknugs",
                  title: "gimme nuggs",
                },
              ],
            },
          ],
        },
      },
    },
  };

  return sendMessage(response);
  // const message = `❄️ cold, ${fixedName} ️❄️? 🔥 we got free nuggets outside building 5 from 12pm to warm you up!! 🔥`;
  // return sendText(id, message);
}

async function getBarcodeURL(psid: string): Promise<string> {
  console.log("getting barcode URL for", psid);
  const result = await dynamo
    .get({
      TableName: "Barcodes",
      Key: {
        psid,
      },
    })
    .promise();

  console.log("dynamodb result", result);

  if (result.Item && result.Item.barcodeID) {
    const { barcodeID } = result.Item;
    return `https://s3-ap-southeast-2.amazonaws.com/tfyc-barcodes/${barcodeID}.png`;
  }

  return generateBarcode(psid);
}

async function sendBurger(pleb: Pleb): Promise<void> {
  const { id, name } = pleb;
  console.log("Sending to", id, name);
  const fixedName = name || "my friend";

  const response: Response = {
    recipient: {
      id,
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          image_aspect_ratio: "horizontal",
          template_type: "generic",
          elements: [
            {
              title: `Come sample try some Lord of the Fries burgers, ${fixedName}! 🍔`,
              image_url: "https://i.imgur.com/Ub5u5I7.jpg",
              subtitle: `Building 10, next to JobShop - try one and get a FREE discount code at LOTF!`,
            },
          ],
        },
      },
    },
  };

  await sendMessage(response);
}

async function sendLOTF(pleb: Pleb): Promise<void> {
  const { id, name } = pleb;
  const barcodeURL = await getBarcodeURL(id);
  console.log("Sending to", id, name);
  const fixedName = name || "my friend";

  console.log("Got barcodeURL", barcodeURL);

  const response: Response = {
    recipient: {
      id,
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          image_aspect_ratio: "square",
          template_type: "generic",
          elements: [
            {
              title: `Had lunch yet, ${fixedName}?`,
              image_url: barcodeURL,
              subtitle: `Get FREE fries AND sauce with any Premium Chick'n Burger from Lord of the Fries!`,
              default_action: {
                type: "web_url",
                url: barcodeURL,
                webview_height_ratio: "tall",
              },
              buttons: [
                {
                  type: "web_url",
                  url: barcodeURL,
                  title: "Get discount",
                },
              ],
            },
          ],
        },
      },
    },
  };

  await sendMessage(response);

  const message = `Lord of the Fries is just next to Subway on Glenferrie Rd 👀`;
  return sendText(id, message);
}

export async function go(): Promise<void> {
  console.log("Fetching users..");
  // const thePlebs = await peasants();
  const thePlebs = await peasants();
  // console.log("Total peasants", thePeasants.length);

  // const thePlebs = await plebs();

  console.log("Fetching haters..");
  // const theHaters = await haters();
  const theHaters = [];

  console.log("Got haters", theHaters);
  const theGoodOnes = thePlebs.filter(({ id }) => theHaters.indexOf(id) === -1);
  console.log(`Sending to ${theGoodOnes.length} people..`);

  for (let goodOne of theGoodOnes) {
    // await sendNuggets(one);
    // await sendLOTF(goodOne);
    await sendBurger(goodOne);
    console.log(`Done with ${goodOne.name}`);
  }

  console.log("All done!");
}

if (process.env["NODE_ENV"] !== "test") {
  go()
    .then(() => console.log("Done!"))
    .catch(e => console.error(e));
}
