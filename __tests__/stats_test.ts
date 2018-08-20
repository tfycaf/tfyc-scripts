import { go } from "../stats";

jest.setTimeout(10000);

it("shows stats", async () => {
  const result = await go();
  console.log(result);
  expect(result).toBeDefined();
});
