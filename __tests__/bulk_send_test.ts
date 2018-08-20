let mockSendMessage;
jest.setTimeout(20001);

jest.mock("../sendMessage", () => {
  mockSendMessage = jest.fn(() => Promise.resolve());
  return {
    sendMessage: mockSendMessage,
    sendText: mockSendMessage,
  };
});

jest.mock("../generateBarcode", () => {
  return {
    default: jest.fn(() => Promise.resolve()),
  };
});

import { go } from "../bulk_send";

it.skip("does a bulk send bro", async done => {
  await go();
  expect(mockSendMessage).toHaveBeenCalled();
  done();
});
