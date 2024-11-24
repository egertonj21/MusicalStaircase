import { fetchInitialLedData, updateLedStripStatus, fetchLedStripId, fetchColourRgb, updateLedStripColor } from "../controllers/ledstripControllers.js";

export default (wss, connection) => {
    wss.on('connection', (ws) => {
        console.log('New client connected');

        ws.on('message', async (message) => {
            const data = JSON.parse(message);
            const { action, payload } = data;

            switch (action) {
                case 'fetch_initial_led_data':
                    await fetchInitialLedData(ws, connection);
                    break;
                case 'updateLedStripStatus':
                    await updateLedStripStatus(ws, connection, payload);
                    break;
                case 'fetchLedStripId':
                    await fetchLedStripId(ws, connection, payload);
                    break;
                case 'fetchColourRgb':
                    await fetchColourRgb(ws, connection, payload);
                    break;
                case 'updateLedStripColor': // New action
                    await updateLedStripColor(ws, connection, payload);
                    break;
                default:
                    console.error('Unknown action:', action);
            }
        });

        ws.on('close', () => {
            console.log('Client disconnected');
        });
    });
};
