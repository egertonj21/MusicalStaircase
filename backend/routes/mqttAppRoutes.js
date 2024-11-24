
import { sendControlMessage, sendMuteMessage } from '../controllers/mqttAppControllers.js';

export default (wss, connection) => {
    wss.on('connection', (ws) => {
        console.log('New client connected');

        ws.on('message', async (message) => {
            const data = JSON.parse(message);
            const { action, payload } = data;

            switch (action) {
                case 'sendControlMessage':
                    await sendControlMessage(ws, payload.action);
                    break;
                case 'sendMuteMessage':
                    await sendMuteMessage(ws);
                    break
                default:
                    console.error('Unknown action:', action);
            }
        });

        ws.on('close', () => {
            console.log('Client disconnected');
        });
    });
};
