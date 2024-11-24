import {
    getActions,
    getRanges,
    getNotes,
    getNoteDetails,
    updateRange,
    getSensorLight,
    getSensorLightById,
    createSensorLight,
    updateSensorLightColour,
    getSelectedOutput,
    updateSelectedOutput,
    getLightDurations,
    createLightDuration,
    getColours,
    getLogs,
    getSensorStatus,
    getAllSensorAwakeInfo,
    getMute,
    updateMute
} from "../controllers/otherControllers.js";

export default (wss, connection) => {
    wss.on('connection', (ws) => {
        console.log('New client connected');

        ws.on('message', async (message) => {
            const data = JSON.parse(message);
            const { action, payload } = data;

            switch (action) {
                case 'getActions':
                    await getActions(ws, connection);
                    break;
                case 'getRanges':
                    await getRanges(ws, connection);
                    break;
                case 'getNotes':
                    await getNotes(ws, connection);
                    break;
                case 'getNoteDetails':
                    await getNoteDetails(ws, connection, payload);
                    break;
                case 'updateRange':
                    await updateRange(ws, connection, payload);
                    break;
                case 'getSensorLight':
                    await getSensorLight(ws, connection);
                    break;
                case 'getSensorLightById':
                    await getSensorLightById(ws, connection, payload);
                    break;
                case 'createSensorLight':
                    await createSensorLight(ws, connection, payload);
                    break;
                case 'updateSensorLightColour':
                    await updateSensorLightColour(ws, connection, payload);
                    break;
                case 'getSelectedOutput':
                    await getSelectedOutput(ws, connection, payload);
                    break;
                case 'updateSelectedOutput':
                    await updateSelectedOutput(ws, connection, payload);
                    break;
                case 'getLightDurations':
                    await getLightDurations(ws, connection);
                    break;
                case 'createLightDuration':
                    await createLightDuration(ws, connection, payload);
                    break;
                case 'getColours':
                    await getColours(ws, connection);
                    break;
                case 'getLogs':
                    await getLogs(ws, connection);
                    break;
                case 'getSensorStatus':
                    await getSensorStatus(ws, connection);
                    break;
                case 'getAllSensorAwakeInfo':
                    await getAllSensorAwakeInfo(ws, connection);
                    break;
                case 'getMute':
                    await getMute(ws, connection);
                    break;
                case 'updateMute':
                    await updateMute(ws, connection, payload);
                    break;
                default:
                    console.error('Unknown action:', action);
                    ws.send(JSON.stringify({ action: 'error', message: `Unknown action: ${action}` }));
                }
        });

        ws.on('close', () => {
            console.log('Client disconnected');
        });
    });
};
