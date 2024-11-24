import { getSensors, logSensorData, updateSensorStatus, fetchSensorRanges, fetchLightDuration, fetchInitialData, controlSensor, controlMute, getLogs, getSensorStatus, getMuteStatus, getCurrentSettings, updateMuteStatus } from "../controllers/sensorControllers.js";

export default (wss, connection) => {
    wss.on('connection', (ws) => {
        console.log('New client connected');

        ws.on('message', async (message) => {
            const data = JSON.parse(message);
            const { action, payload } = data;

            console.log(`Received action: ${action}, payload:`, payload); // Debugging
            
            try {
                switch (action) {
                    case 'getSensors':
                        await getSensors(ws, connection);
                        break;
                    case 'fetch_initial_data':
                        await fetchInitialData(ws, connection);
                        break;
                    case 'logSensorData':
                        await logSensorData(ws, connection, payload);
                        break;
                    case 'fetch_current_settings':
                        await getCurrentSettings(ws, connection, payload);
                        break;
                    case 'updateSensorStatus':
                        await updateSensorStatus(ws, connection, payload);
                        break;
                    case 'fetchSensorRanges':
                        await fetchSensorRanges(ws, connection);
                        break;
                    case 'fetchLightDuration':
                        await fetchLightDuration(ws, connection);
                        break;
                    case 'control_sensor':  // New case for controlling sensors
                        await controlSensor(ws, connection, payload);
                        break;
                    case 'control_mute':  // New case for controlling mute functionality
                        await controlMute(ws, connection, payload);
                        break;
                    case 'getLogs':  // New case for fetching logs
                        await getLogs(ws, connection);
                        break;
                    case 'get_sensor_status':  // New case for fetching sensor status
                        await getSensorStatus(ws, connection);
                        break;
                    case 'get_mute_status':  // New case for fetching mute status
                        await getMuteStatus(ws, connection);
                        break;
                    case 'update_mute_status':
                        await updateMuteStatus(ws, connection, payload);
                        break;
                    default:
                        console.error('Unknown action:', action);
                        ws.send(JSON.stringify({ action: 'error', message: `Unknown action: ${action}` }));
                }
            } catch (error) {
                console.error('Error handling action:', action, error);
                ws.send(JSON.stringify({ action: 'error', message: error.message }));
            }
        });

        ws.on('close', () => {
            console.log('Client disconnected');
        });
    });
};
