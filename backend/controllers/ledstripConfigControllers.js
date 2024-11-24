import mqttClient from '../mqttClient.js';

export const getRangeLimits = async (ws, connection) => {
    try {
        const [rows] = await connection.execute(
            "SELECT range_ID, upper_limit FROM sensor_range WHERE range_ID IN (1, 2)"
        );

        const closeRange = rows.find(row => row.range_ID === 1);
        const midRange = rows.find(row => row.range_ID === 2);

        if (closeRange && midRange) {
            const response = JSON.stringify({
                action: 'getRangeLimits',
                data: {
                    closeUpperLimit: closeRange.upper_limit,
                    midUpperLimit: midRange.upper_limit
                }
            });
            console.log(`Sending response for getRangeLimits: ${response}`);
            ws.send(response);
        } else {
            throw new Error("Missing range data");
        }
    } catch (error) {
        console.error(error);
        ws.send(JSON.stringify({ action: 'error', message: "Failed to fetch range limits" }));
    }
};

export const determineLEDColor = async (ws, connection, payload) => {
    const { sensorName } = payload;

    if (typeof sensorName !== 'string') {
        ws.send(JSON.stringify({ action: 'error', message: "Invalid input data" }));
        return;
    }

    try {
        // Get the LED_strip_ID based on the sensor name
        const [ledStripRows] = await connection.execute(
            "SELECT LED_strip_ID FROM LED_strip WHERE LED_strip_name = ?",
            [sensorName]
        );

        if (ledStripRows.length === 0) {
            ws.send(JSON.stringify({ action: 'error', message: "Invalid sensor name" }));
            return;
        }

        const LED_strip_ID = ledStripRows[0].LED_strip_ID;

        // Get all color configurations for the given LED_strip_ID
        const [sensorLightRows] = await connection.execute(
            "SELECT sl.range_ID, c.red, c.green, c.blue FROM sensor_light sl JOIN colour c ON sl.colour_ID = c.colour_ID WHERE sl.LED_strip_ID = ?",
            [LED_strip_ID]
        );

        if (sensorLightRows.length === 0) {
            ws.send(JSON.stringify({ action: 'error', message: "No matching colors found for the given sensor" }));
            return;
        }

        const colors = sensorLightRows.map(row => ({
            range_ID: row.range_ID,
            red: row.red,
            green: row.green,
            blue: row.blue
        }));

        // Send the RGB values back via WebSocket
        const response = JSON.stringify({
            action: 'determineLEDColor',
            data: colors
        });

        console.log(`Sending response for determineLEDColor: ${response}`);
        ws.send(response);
    } catch (error) {
        console.error(error);
        ws.send(JSON.stringify({ action: 'error', message: "Failed to determine LED colors" }));
    }
};


export const updateRangeSettings = async (ws, connection, payload) => {
    try {
        // Fetch the updated range settings from the database
        const [rows] = await connection.execute(
            "SELECT range_ID, upper_limit FROM sensor_range WHERE range_ID IN (1, 2)"
        );

        const closeRange = rows.find(row => row.range_ID === 1);
        const midRange = rows.find(row => row.range_ID === 2);

        if (!closeRange || !midRange) {
            throw new Error("Failed to fetch updated range limits");
        }

        const closeUpperLimit = closeRange.upper_limit;
        const midUpperLimit = midRange.upper_limit;

        // Send MQTT message to update device range settings
        const range_message = `${closeUpperLimit},${midUpperLimit}`;
        mqttClient.publish('config/range_ledstrip', range_message, () => {
            console.log('MQTT message sent:', range_message);
        });

        ws.send(JSON.stringify({ action: 'updateRangeSettings', message: "Range settings updated and sent successfully" }));
    } catch (error) {
        console.error(error);
        ws.send(JSON.stringify({ action: 'error', message: "Failed to update range settings" }));
    }
};

export const setLEDColors = async (ws, connection, payload) => {
    const { sensorName } = payload;

    if (typeof sensorName !== 'string') {
        ws.send(JSON.stringify({ action: 'error', message: "Invalid input data" }));
        return;
    }

    try {
        console.log(`Received sensorName: ${sensorName}`);

        // Get the LED_strip_ID based on the sensor name
        const [ledStripRows] = await connection.execute(
            "SELECT LED_strip_ID FROM LED_strip WHERE LED_strip_name = ?",
            [sensorName]
        );

        if (ledStripRows.length === 0) {
            ws.send(JSON.stringify({ action: 'error', message: "Invalid sensor name" }));
            return;
        }

        const LED_strip_ID = ledStripRows[0].LED_strip_ID;

        // Get all color configurations for the given LED_strip_ID
        const [sensorLightRows] = await connection.execute(
            "SELECT sl.range_ID, c.red, c.green, c.blue FROM sensor_light sl JOIN colour c ON sl.colour_ID = c.colour_ID WHERE sl.LED_strip_ID = ?",
            [LED_strip_ID]
        );

        if (sensorLightRows.length === 0) {
            ws.send(JSON.stringify({ action: 'error', message: "No matching colors found for the given sensor" }));
            return;
        }

        const colors = sensorLightRows.map(row => ({
            range_ID: row.range_ID,
            red: row.red,
            green: row.green,
            blue: row.blue
        }));

        // Send the color configuration to the MQTT topic
        colors.forEach(color => {
            let range;
            if (color.range_ID === 1) range = 'close';
            else if (color.range_ID === 2) range = 'mid';
            else if (color.range_ID === 3) range = 'far';
            else return; // Invalid range_ID

            const colorMessage = `${range}&${color.red},${color.green},${color.blue}`;
            mqttClient.publish(`config/${sensorName}`, colorMessage, () => {
                console.log(`MQTT message sent for ${range} range: ${colorMessage}`);
            });
        });

        ws.send(JSON.stringify({ action: 'setLEDColors', message: "LED colors set and sent successfully" }));
    } catch (error) {
        console.error(error);
        ws.send(JSON.stringify({ action: 'error', message: "Failed to set LED colors" }));
    }
};


