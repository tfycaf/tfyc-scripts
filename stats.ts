import DynamoDB from "aws-sdk/clients/dynamodb";
import { DateTime } from "luxon";
import lodash from "lodash";
import { table } from "table";
import fs from "fs";

const dynamo = new DynamoDB.DocumentClient({
  region: "us-east-1",
});

async function buildTable(feedback: any): Promise<string> {
  const data = lodash
    .chain(feedback)
    .groupBy(o => DateTime.fromMillis(o.createdAt).toISODate())
    .mapValues(o =>
      lodash
        .chain(o)
        .groupBy("type")
        .mapValues(o =>
          lodash
            .chain(o)
            .groupBy("payload")
            .mapValues("length")
            .value()
        )
        .value()
    )
    .value();

  const tableData = [
    ["Date", "Vegan Reactions", "Food Rating"],
    ...lodash.sortBy(
      lodash.map(data, (o, k) => [
        k,
        prettyObject(o["VEGAN_REACTION"]),
        prettyObject(o["FOOD_REACTION"]),
      ]),
      i => i[0]
    ),
  ];

  return table(tableData);
}

function prettyObject(obj: any): string {
  let sorted = lodash(obj)
    .toPairs()
    .sortBy(0)
    .fromPairs()
    .value();

  return JSON.stringify(sorted);
}

export async function go(): Promise<string> {
  console.log("Fetching stats, hang tight..");
  const feedbackResult = await dynamo
    .scan({
      TableName: "Feedback",
      ProjectionExpression: "psid,#t,payload,createdAt",
      ExpressionAttributeNames: {
        "#t": "type",
      },
    })
    .promise();

  const feedback = feedbackResult.Items;

  return buildTable(feedback);
}

if (process.env["NODE_ENV"] !== "test") {
  go()
    .then(r => {
      console.log(r);
    })
    .catch(console.error);
}
