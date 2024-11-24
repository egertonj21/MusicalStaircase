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
import { fetchInitialLedData, updateLedStripStatus, updateLedStripAlive, fetchLedStripId, fetchColourRgb, updateLedStripColor, gameLedTrigger, checkLEDOn } from "../controllers/ledstripControllers.js";
import { sendControlMessage, sendMuteMessage, sendLEDTrigger, getLEDTriggerPayload, updateLEDStatus } from '../controllers/mqttAppControllers.js';
import { getSensors, logSensorData, updateSensorStatus, updateSensorAlive, fetchSensorRanges, fetchLightDuration, fetchInitialData, controlSensor, controlMute, getMuteStatus, getCurrentSettings, updateMuteStatus, fetchAllPresets, updateActionTableWithPreset } from "../controllers/sensorControllers.js";
import {fetchAllPositions, fetchAllSecuritySequences, addSecuritySequence, updateSecuritySequence, deleteSecuritySequence} from "../controllers/securityModeControllers.js";
import {fetchAllModes, updateActiveMode, fetchActiveMode} from "../controllers/modeSettingControllers.js";
import {getRangeLimits, determineLEDColor, updateRangeSettings, setLEDColors} from "../controllers/ledstripConfigControllers.js";
import { handleGameSequencePayload, fetchGameLength, updateGameLength } from "../controllers/gameControllers.js";
import { broadcast } from "../server.js";
export default (wss, connection) => {
    wss.on('connection', (ws) => {
        console.log('New client connected');

        ws.on('message', async (message) => {
            console.log(`Received message: ${message}`);
            const data = JSON.parse(message);
            const { action, payload } = data;

            console.log(`Received action: ${action}, payload: ${JSON.stringify(payload)}`);

            switch (action) {

                case 'alarm':
                    console.log('Broadcasting alarm message');
                    broadcast({ type: 'alarm', payload });
                    break;

                case 'fetchAllPresets':
                    await fetchAllPresets(ws, connection, payload);
                    break;
                case 'updateActionTableWithPreset':
                    await updateActionTableWithPreset(ws, connection, payload);
                    break;

                case 'fetchGameLength':
                    await fetchGameLength(ws, connection);
                    break;
                case 'updateGameLength':
                    await updateGameLength(ws, connection, payload);
                    break;

                case 'handleGameSequencePayload':
                    await handleGameSequencePayload(ws, connection, payload);
                    break;

                case 'checkLEDOn':
                    await checkLEDOn(ws, connection, payload);
                    break;
                case 'updateLEDStatus':
                    await updateLEDStatus(ws, connection, payload);
                    break;
                case 'gameLEDTrigger':
                    await gameLedTrigger(ws, connection, payload);
                    break;
                case 'setLEDColors':  
                    await setLEDColors(ws, connection, payload);
                    break;
                case 'updateRangeSettings':
                    await updateRangeSettings(ws, connection, payload);
                    break;
                case 'determineLEDColor':
                    await determineLEDColor(ws, connection, payload);
                    break;
                case 'getRangeLimits':
                    await getRangeLimits(ws, connection, payload);
                    break;
                case 'fetchActiveMode':
                    await fetchActiveMode(ws, connection, payload);
                    break;
                case 'updateActiveMode':
                    await updateActiveMode(ws, connection, payload);
                    break;
                case 'fetchAllModes':
                    await fetchAllModes(ws, connection, payload);
                    break;
                case 'addSecuritySequence':
                    await addSecuritySequence(ws, connection, payload);
                    break;
                case 'deleteSecuritySequence':
                    await deleteSecuritySequence(ws, connection, payload);
                    break;
                case 'updateSecuritySequence':
                    await updateSecuritySequence(ws, connection, payload);
                    break;
                case 'fetchAllSecuritySequences':
                    await fetchAllSecuritySequences(ws, connection, payload);
                    break;
                case 'fetchAllPositions':
                    await fetchAllPositions(ws, connection, payload);   
                    break;
                case 'getLEDTriggerPayload':
                    await getLEDTriggerPayload(ws, connection, payload);
                    break;
                case 'sendLEDTrigger':
                    await sendLEDTrigger(ws, payload);
                    break;
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
                case 'updateSensorAlive':
                    await updateSensorAlive(ws, connection, payload);
                    break;
                case 'fetchSensorRanges':
                    await fetchSensorRanges(ws, connection);
                    break;
                case 'fetchLightDuration':
                    await fetchLightDuration(ws, connection);
                    break;
                case 'control_sensor':  
                    await controlSensor(ws, connection, payload);
                    break;
                case 'control_mute':  
                    await controlMute(ws, connection, payload);
                    break;
                case 'getLogs':  
                    await getLogs(ws, connection);
                    break;
                case 'get_sensor_status':  
                    await getSensorStatus(ws, connection);
                    break;
                case 'get_mute_status':  
                    await getMuteStatus(ws, connection);
                    break;
                case 'update_mute_status':
                    await updateMuteStatus(ws, connection, payload);
                    break;
                case 'sendControlMessage':
                    await sendControlMessage(ws, payload.action);
                    break;
                case 'sendMuteMessage':
                    await sendMuteMessage(ws);
                    break
                case 'fetch_initial_led_data':
                    await fetchInitialLedData(ws, connection);
                    break;
                case 'updateLedStripStatus':
                    await updateLedStripStatus(ws, connection, payload);
                    break;
                case 'updateLedStripAlive':
                    await updateLedStripAlive(ws, connection, payload);
                    break;
                case 'fetchLedStripId':
                    await fetchLedStripId(ws, connection, payload);
                    break;
                case 'fetchColourRgb':
                    await fetchColourRgb(ws, connection, payload);
                    break;
                case 'updateLedStripColor': 
                    await updateLedStripColor(ws, connection, payload);
                    break;
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
