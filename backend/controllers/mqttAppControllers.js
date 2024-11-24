// controllers/mqttControllers.js
import mqttClient from '../mqttClient.js';

const CONTROL_TOPIC = 'control/distance_sensor';
const MUTE_TOPIC = 'audio/mute';
const MQTT_CONTROL_TOPIC = 'trigger/ledstrip';

export const sendControlMessage = async (ws, action) => {
    if (!action || (action !== 'sleep' && action !== 'wake')) {
        const error = 'Invalid action. Must be "sleep" or "wake".';
        console.error(error);
        ws.send(JSON.stringify({ action: 'control', error }));
        return;
    }

    mqttClient.publish(CONTROL_TOPIC, action, (err) => {
        if (err) {
            console.error('Failed to publish MQTT message:', err);
            ws.send(JSON.stringify({ action: 'control', error: 'Failed to send message' }));
        } else {
            ws.send(JSON.stringify({ action: 'control', message: `Sent ${action} to ${CONTROL_TOPIC}` }));
        }
    });
};

export const sendMuteMessage = async (ws) => {
    mqttClient.publish(MUTE_TOPIC, 'mute', (err) => {
        if (err) {
            console.error('Failed to publish MQTT message:', err);
            ws.send(JSON.stringify({ action: 'mute', error: 'Failed to send message' }));
        } else {
            ws.send(JSON.stringify({ action: 'mute', message: `Sent 'mute' to ${MUTE_TOPIC}` }));
        }
    });
};

export const getLEDTriggerPayload = async (ws, connection, payload) => {
    const { sensor_id, distance, request_id } = payload;

    try {
        // Fetch the range data from the database
        const [ranges] = await connection.execute("SELECT range_ID, range_name, lower_limit, upper_limit FROM sensor_range");

        // Determine range_ID based on distance
        let range_id = null;
        for (let range of ranges) {
            if (distance >= range.lower_limit && distance < range.upper_limit) {
                range_id = range.range_ID;
                break;
            }
        }

        if (range_id === null) {
            ws.send(JSON.stringify({ action: 'error', message: 'Invalid distance', request_id }));
            return;
        }

        // Fetch the sensor_name from the sensor table
        const [sensorRows] = await connection.execute("SELECT sensor_name FROM sensor WHERE sensor_ID = ?", [sensor_id]);
        if (sensorRows.length === 0) {
            ws.send(JSON.stringify({ action: 'error', message: 'Sensor not found', request_id }));
            return;
        }
        const sensor_name = sensorRows[0].sensor_name;

        // Determine the corresponding LED_strip_ID from the LED_strip table
        const led_strip_name = `ledstrip${sensor_name}`;
        const [ledStripRows] = await connection.execute("SELECT LED_strip_ID FROM LED_strip WHERE LED_strip_name = ?", [led_strip_name]);
        if (ledStripRows.length === 0) {
            ws.send(JSON.stringify({ action: 'error', message: 'LED strip not found', request_id }));
            return;
        }
        const led_strip_id = ledStripRows[0].LED_strip_ID;

        // Fetch the appropriate colour_ID from the sensor_light table
        const [sensorLightRows] = await connection.execute("SELECT colour_ID FROM sensor_light WHERE LED_strip_ID = ? AND range_ID = ?", [led_strip_id, range_id]);
        if (sensorLightRows.length === 0) {
            ws.send(JSON.stringify({ action: 'error', message: 'Sensor light configuration not found', request_id }));
            return;
        }
        const colour_id = sensorLightRows[0].colour_ID;

        // Fetch the RGB values from the colour table
        const [colourRows] = await connection.execute("SELECT red, green, blue FROM colour WHERE colour_ID = ?", [colour_id]);
        if (colourRows.length === 0) {
            ws.send(JSON.stringify({ action: 'error', message: 'Colour not found', request_id }));
            return;
        }
        const { red, green, blue } = colourRows[0];

        // Determine start_LED and end_LED based on range_ID
        const MAX_LED = 30; // Adjust this value as needed
        let start_led, end_led;
        switch (range_id) {
            case 1:
                start_led = 0;
                end_led = Math.floor(MAX_LED / 3) - 1;
                break;
            case 2:
                start_led = Math.floor(MAX_LED / 3);
                end_led = Math.floor(2 * MAX_LED / 3) - 1;
                break;
            case 3:
                start_led = Math.floor(2 * MAX_LED / 3);
                end_led = MAX_LED - 1;
                break;
        }

        // Example duration value (replace with your logic or fetch from database if needed)
        const duration = 3;

        // Construct the payload
        const message = `${start_led}-${end_led}&${red},${green},${blue}&${duration}`;
        const responsePayload = {
            action: 'LEDTrigger',
            payload: message,
            request_id
        };

        // Send the payload to the client
        ws.send(JSON.stringify(responsePayload));
        

        // Send the MQTT message
        await sendLEDTrigger(ws, { sensor_id, message, request_id });
    } catch (error) {
        console.error(error);
        ws.send(JSON.stringify({ action: 'error', message: "Failed to fetch LED trigger payload", request_id }));
    }
};




export const sendLEDTrigger = async (ws, payload) => {
    const { sensor_id, message, request_id } = payload;
    const mqttTopic = `${MQTT_CONTROL_TOPIC}${sensor_id}`;

    mqttClient.publish(mqttTopic, message, (err) => {
        if (err) {
            console.error('Failed to publish MQTT message:', err);
            ws.send(JSON.stringify({ action: 'LEDTrigger', error: 'Failed to send message', request_id }));
        } else {
            const responsePayload = { action: 'LEDTrigger', message: `Sent ${message} to ${mqttTopic}`, request_id };
            ws.send(JSON.stringify(responsePayload));
            
        }
    });
};





export const updateLEDStatus = async (ws, connection, payload) => {
    try {
        const [rows] = await connection.execute("SELECT * FROM led_on_status");
        const currentStatus = rows[0].led_on;
        const newStatus = currentStatus === 1 ? 0 : 1;

        // Update the led_on_status table
        await connection.execute("UPDATE led_on_status SET led_on = ? WHERE led_on_id = 1", [newStatus]);

        // Topics to publish to
        const mqttTopics = ["control/led_on1", "control/led_on2", "control/led_on3"];
        const message = newStatus === 1 ? "255,255,255,1" : "0,0,0,0";

        // Publish MQTT message to turn LEDs on or off
        mqttTopics.forEach(topic => {
            mqttClient.publish(topic, message, (err) => {
                if (err) {
                    console.error(`Failed to publish MQTT message to ${topic}:`, err);
                    ws.send(JSON.stringify({ action: 'updateLEDStatus', error: 'Failed to update LED status' }));
                }
            });
        });

        // Send response to the WebSocket client
        ws.send(JSON.stringify({ action: 'updateLEDStatus', data: { led_on: newStatus } }));
    } catch (error) {
        console.error("Failed to update LED status:", error);
        ws.send(JSON.stringify({ action: 'updateLEDStatus', error: "Failed to update LED status" }));
    }
};

