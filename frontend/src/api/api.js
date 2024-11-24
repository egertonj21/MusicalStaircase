import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000'
});

// Fetch the list of sensors
export const fetchSensors = () => api.get('/sensors');

// Fetch actions from the action_table
export const fetchActions = () => api.get('/others/actions');

// Fetch range settings
export const fetchRanges = () => api.get('/others/ranges');

// Fetch notes including their locations
export const fetchNotes = () => api.get('/others/notes');

// Fetch current settings for a selected sensor
export const fetchCurrentSettings = (sensorId) => api.get(`/others/selected-output/${sensorId}`);

// Update selected outputs for a sensor
export const updateSelectedOutputs = (sensorId, data) => api.post(`/others/selected-output/${sensorId}`, data);

// Update range settings for a given range
export const updateRangeSettings = (rangeId, data) => api.put(`/others/range/${rangeId}`, data);

// Fetch note details based on sensor and range ID
export const fetchNoteDetails = (sensorId, rangeId) => api.get(`/note-details/${sensorId}/${rangeId}`);

// Log sensor data
export const logSensorData = (data) => api.post('/log-sensor-data', data);

// Fetch logs
export const fetchLogs = () => api.get('/others/logs');

// Fetch the current awake status of a sensor
export const fetchSensorStatus = () => api.get('/sensor-status');

// Fetch all LED strips
export const fetchLedStrips = () => api.get('/ledstrip');

// Update LED strip status
export const updateLedStrip = (id, data) => api.put(`/ledstrip/${id}`, data);

// Fetch all sensor_light entries
export const fetchSensorLights = () => api.get('/others/sensor-light');

// Fetch a specific sensor_light entry by ID
export const fetchSensorLightById = (id) => api.get(`/sensor-light/${id}`);

// Create a new sensor_light entry
export const createSensorLight = (data) => api.post('/others/sensor-light', data);

// Update an existing sensor_light entry by name
export const updateSensorLight = (LED_strip_ID, range_ID, data) => api.put(`/others/sensor-light/${LED_strip_ID}/${range_ID}`, data);

// Fetch all light_duration entries
export const fetchLightDurations = () => api.get('/others/light-durations');

// Fetch a specific light_duration entry by ID
export const fetchLightDurationById = (id) => api.get(`/light-duration/${id}`);

// Create a new light_duration entry
export const createLightDuration = (data) => api.post('/light-duration', data);

// Update an existing light_duration entry by ID
export const updateLightDuration = (id, data) => api.post(`/light-duration`, data);

// Fetch all colours
export const fetchColours = () => api.get('/others/colours');

// Fetch overall sensor on/off status

export const fetchSensorsAwake = () => api.get('/others/sensorsAwake');

// Update overall sensor on/off status

export const updateSensorsAwake = (data) => api.post('/others/sensor-status', data);

// Fetch Mute Status

export const fetchMute = () => api.get('/others/mute');

// Update Mute Status

export const updateMute = (data) => api.post('/others/mute', data);

export default api;
