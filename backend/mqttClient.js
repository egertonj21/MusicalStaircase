// mqttClient.js
import mqtt from 'mqtt';

const MQTT_SERVER = 'mqtt://192.168.0.93:1883';
const client = mqtt.connect(MQTT_SERVER);

client.on('connect', () => {
    console.log('Connected to MQTT broker');
});

client.on('error', (error) => {
    console.error('MQTT connection error:', error);
});

export default client;
