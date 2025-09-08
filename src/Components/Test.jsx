// replace with a valid token you have

import { tokenService } from "../Apis/tokenService";
const TOKEN = tokenService.getAccess();
const WS_URL = `wss://demerits.authorityentrepreneurs.com/ws/conversations/user/?token=${TOKEN}`;

const ws = new WebSocket(WS_URL);

export default function SetupWebSocket() {

ws.onopen = () => {
  console.log("WS open");
  // send ping
  ws.send(JSON.stringify({ type: "ping" }));
  console.log("sent ping");
};

ws.onmessage = (evt) => {
  try {
    const data = JSON.parse(evt.data);
    console.log("WS message:", data);
  } catch (e) {
    console.log("WS raw message:", evt.data);
  }
};

ws.onclose = (ev) => console.log("WS closed", ev);
ws.onerror = (err) => console.error("WS error", err);
return null;

}


