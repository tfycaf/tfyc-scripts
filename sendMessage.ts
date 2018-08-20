import fetch from "node-fetch";
const PAGE_ACCESS_TOKEN = process.env["PAGE_ACCESS_TOKEN"];
const FACEBOOK_SEND_URL = `https://graph.facebook.com/v2.6/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
import { sample } from "lodash";

interface Recipient {
  id: string;
}

interface Button {
  type: "web_url" | "postback";
  url?: string;
  title: string;
  payload?: string;
}

type AttachmentType = "audio" | "video" | "image" | "file" | "template";
interface TemplateElement {
  title: string;
  image_url: string;
  subtitle: string;
  default_action?: {
    type: string;
    url: string;
    webview_height_ratio: "tall";
  };
  buttons?: Button[];
}

interface Attachment {
  type: AttachmentType;
  payload: {
    attachment_id?: string;
    template_type?: "generic";
    image_aspect_ratio?: "square" | "horizontal";
    elements?: TemplateElement[];
  };
}

interface QuickReplyInput {
  text: string;
  payload: string;
}

interface QuickReply {
  content_type: string;
  title: string;
  payload: string;
}

interface Message {
  text?: string;
  attachment?: Attachment;
  quick_replies?: QuickReply[];
}

type SenderAction = "mark_seen" | "typing_on" | "typing_off";

export interface Response {
  messaging_type?: string;
  recipient: Recipient;
  message?: Message;
  sender_action?: SenderAction;
}

export async function sendTyping(id: string): Promise<void> {
  const typing: Response = {
    messaging_type: "RESPONSE",
    recipient: {
      id,
    },
    sender_action: "typing_on",
  };

  return sendMessage(typing);
}

export async function sendText(id: string, text: string): Promise<void> {
  const response = {
    messaging_type: "RESPONSE",
    recipient: {
      id,
    },
    message: {
      text,
    },
  };

  return sendMessage(response);
}

export type Reaction =
  | "CONFUSED"
  | "FOOD_100"
  | "FOOD_THUMBS_DOWN"
  | "FOOD_THUMBS_UP"
  | "NO_PETITION"
  | "VEGAN_NO"
  | "VEGAN_YES";

export async function sendImage(
  id: string,
  attachment_id: string
): Promise<void> {
  const response: Response = {
    messaging_type: "RESPONSE",
    recipient: {
      id,
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          attachment_id,
        },
      },
    },
  };

  return sendMessage(response);
}

export async function sendQuickReplies(
  id: string,
  text: string,
  quickReplies: QuickReplyInput[]
): Promise<void> {
  const quick_replies = quickReplies.map(q => ({
    content_type: "text",
    title: q.text,
    payload: q.payload,
  }));

  const response: Response = {
    messaging_type: "RESPONSE",
    recipient: {
      id,
    },
    message: {
      text,
      quick_replies,
    },
  };

  return sendMessage(response);
}

export async function sendMessage(response: Response): Promise<void> {
  console.log("Sending response..", JSON.stringify(response));
  fetch(FACEBOOK_SEND_URL, {
    method: "POST",
    body: JSON.stringify(response),
    headers: {
      "Content-Type": "application/json",
    },
  }).then(res => res.json());
}
