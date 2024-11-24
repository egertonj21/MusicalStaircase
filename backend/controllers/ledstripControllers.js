export const updateLedStripStatus = async (ws, connection, payload) => {
    const { led_strip_name, active, alive, colour_id } = payload;

    console.log(`Received payload: led_strip_name=${led_strip_name}, active=${active}, alive=${alive}, colour_id=${colour_id}`);

    // Validate the input data
    if (led_strip_name === undefined || active === undefined || alive === undefined) {
        console.error("Invalid input data: led_strip_name, active, or alive is undefined");
        ws.send(JSON.stringify({ action: 'updateLedStripStatus', error: "Invalid input data: led_strip_name, active, or alive is undefined" }));
        return;
    }

    try {
        const [rows] = await connection.execute("SELECT 1 FROM LED_strip WHERE LED_strip_name = ?", [led_strip_name]);
        if (rows.length === 0) {
            let resolved_colour_id = colour_id;
            if (resolved_colour_id === undefined || resolved_colour_id === null) {
                const [colourRows] = await connection.execute("SELECT colour_ID FROM colour LIMIT 1");
                if (colourRows.length === 0) {
                    ws.send(JSON.stringify({ action: 'updateLedStripStatus', error: "No default colour_ID found" }));
                    return;
                }
                resolved_colour_id = colourRows[0].colour_ID;
            }
            await connection.execute("INSERT INTO LED_strip (LED_strip_name, LED_alive, LED_active, colour_ID) VALUES (?, ?, ?, ?)", [led_strip_name, alive || 0, active || 0, resolved_colour_id]);
            ws.send(JSON.stringify({ action: 'updateLedStripStatus', message: "LED strip status inserted successfully" }));
        } else {
            if (active !== undefined) {
                await connection.execute("UPDATE LED_strip SET LED_active = ? WHERE LED_strip_name = ?", [active, led_strip_name]);
            }
            if (alive !== undefined) {
                await connection.execute("UPDATE LED_strip SET LED_alive = ? WHERE LED_strip_name = ?", [alive, led_strip_name]);
            }
            if (colour_id !== undefined && colour_id !== null) {
                await connection.execute("UPDATE LED_strip SET colour_ID = ? WHERE LED_strip_name = ?", [colour_id, led_strip_name]);
            }
            ws.send(JSON.stringify({ action: 'updateLedStripStatus', message: "LED strip status updated successfully" }));
        }
    } catch (error) {
        console.error("Failed to update LED strip status:", error);
        ws.send(JSON.stringify({ action: 'updateLedStripStatus', error: "Failed to update LED strip status" }));
    }
};

export const updateLedStripAlive = async (ws, connection, payload) => {
    const { led_strip_name, alive } = payload;

    console.log(`Received payload: led_strip_name=${led_strip_name}, alive=${alive}`);

    // Validate the input data
    if (led_strip_name === undefined || alive === undefined) {
        console.error("Invalid input data: led_strip_name or alive is undefined");
        ws.send(JSON.stringify({ action: 'updateLedStripStatus', error: "Invalid input data: led_strip_name or alive is undefined" }));
        return;
    }

    try {
        // Check if the LED strip exists in the database
        const [rows] = await connection.execute("SELECT 1 FROM LED_strip WHERE LED_strip_name = ?", [led_strip_name]);
        if (rows.length === 0) {
            // Insert new LED strip if it does not exist
            await connection.execute("INSERT INTO LED_strip (LED_strip_name, LED_alive) VALUES (?, ?)", [led_strip_name, alive]);
            ws.send(JSON.stringify({ action: 'updateLedStripStatus', message: "LED strip status inserted successfully" }));
        } else {
            // Update the LED strip status if it exists
            await connection.execute("UPDATE LED_strip SET LED_alive = ? WHERE LED_strip_name = ?", [alive, led_strip_name]);
            ws.send(JSON.stringify({ action: 'updateLedStripStatus', message: "LED strip status updated successfully" }));
        }
    } catch (error) {
        console.error("Failed to update LED strip status:", error);
        ws.send(JSON.stringify({ action: 'updateLedStripStatus', error: "Failed to update LED strip status" }));
    }
};

export const fetchLedStripId = async (ws, connection, payload) => {
    const { led_strip_name } = payload;
    try {
        const [rows] = await connection.execute("SELECT LED_strip_ID FROM LED_strip WHERE LED_strip_name = ?", [led_strip_name]);
        if (rows.length > 0) {
            ws.send(JSON.stringify({ action: 'fetchLedStripId', data: { led_strip_id: rows[0].LED_strip_ID } }));
        } else {
            ws.send(JSON.stringify({ action: 'fetchLedStripId', error: "LED strip not found" }));
        }
    } catch (error) {
        console.error("Failed to fetch LED strip ID:", error);
        ws.send(JSON.stringify({ action: 'fetchLedStripId', error: "Failed to fetch LED strip ID" }));
    }
};

export const fetchColourRgb = async (ws, connection, payload) => {
    const { led_strip_id, range_id } = payload;
    try {
        const [rows] = await connection.execute(
            `SELECT c.red, c.green, c.blue
             FROM sensor_light sl
             INNER JOIN LED_strip ls ON sl.LED_strip_ID = ls.LED_strip_ID
             INNER JOIN colour c ON sl.colour_ID = c.colour_ID
             WHERE sl.LED_strip_ID = ? AND sl.range_ID = ?`,
            [led_strip_id, range_id]
        );
        if (rows.length > 0) {
            ws.send(JSON.stringify({ action: 'fetchColourRgb', data: { colour_rgb: rows[0] } }));
        } else {
            ws.send(JSON.stringify({ action: 'fetchColourRgb', error: "Colour not found" }));
        }
    } catch (error) {
        console.error("Failed to fetch colour RGB:", error);
        ws.send(JSON.stringify({ action: 'fetchColourRgb', error: "Failed to fetch colour RGB" }));
    }
};

export const updateSensorLightColour = async (ws, connection, payload) => {
    const { LED_strip_ID, range_ID, colour_ID } = payload;

    if (LED_strip_ID === undefined || range_ID === undefined || colour_ID === undefined) {
        console.error("Invalid input data: LED_strip_ID, range_ID, or colour_ID is undefined");
        ws.send(JSON.stringify({ action: 'updateSensorLightColour', error: "Invalid input data: LED_strip_ID, range_ID, or colour_ID is undefined" }));
        return;
    }

    try {
        const [rows] = await connection.execute(
            `SELECT 1 FROM sensor_light WHERE LED_strip_ID = ? AND range_ID = ?`,
            [LED_strip_ID, range_ID]
        );

        if (rows.length > 0) {
            await connection.execute(
                `UPDATE sensor_light SET colour_ID = ? WHERE LED_strip_ID = ? AND range_ID = ?`,
                [colour_ID, LED_strip_ID, range_ID]
            );
            ws.send(JSON.stringify({ action: 'updateSensorLightColour', message: "Sensor light colour updated successfully" }));
        } else {
            await connection.execute(
                `INSERT INTO sensor_light (LED_strip_ID, range_ID, colour_ID) VALUES (?, ?, ?)`,
                [LED_strip_ID, range_ID, colour_ID]
            );
            ws.send(JSON.stringify({ action: 'updateSensorLightColour', message: "Sensor light colour inserted successfully" }));
        }
    } catch (error) {
        console.error("Failed to update sensor light colour:", error);
        ws.send(JSON.stringify({ action: 'updateSensorLightColour', error: "Failed to update sensor light colour" }));
    }
};

export const fetchInitialLedData = async (ws, connection) => {
    try {
        const [ledStrips, ranges, colours, sensorLights] = await Promise.all([
            connection.execute("SELECT * FROM LED_strip"),
            connection.execute("SELECT * FROM sensor_range"),
            connection.execute("SELECT * FROM colour"),
            connection.execute("SELECT * FROM sensor_light")
        ]);

        ws.send(JSON.stringify({
            action: 'fetch_initial_led_data',
            ledStrips: ledStrips[0],
            ranges: ranges[0],
            colours: colours[0],
            sensorLights: sensorLights[0]
        }));
    } catch (error) {
        ws.send(JSON.stringify({ action: 'error', message: error.message }));
    }
};

export const updateLedStripColor = async (ws, connection, payload) => {
    const { led_strip_id, colour_id } = payload;

    console.log(`Received payload: led_strip_id=${led_strip_id}, colour_id=${colour_id}`);

    // Validate the input data
    if (led_strip_id === undefined || colour_id === undefined) {
        console.error("Invalid input data: led_strip_id or colour_id is undefined");
        ws.send(JSON.stringify({ action: 'updateLedStripColor', error: "Invalid input data: led_strip_id or colour_id is undefined" }));
        return;
    }

    try {
        await connection.execute("UPDATE LED_strip SET colour_ID = ? WHERE LED_strip_ID = ?", [colour_id, led_strip_id]);
        const [rows] = await connection.execute("SELECT * FROM LED_strip WHERE LED_strip_ID = ?", [led_strip_id]);
        if (rows.length > 0) {
            ws.send(JSON.stringify({ action: 'updateLedStripColor', ledStrip: rows[0] }));
        } else {
            ws.send(JSON.stringify({ action: 'updateLedStripColor', error: "LED strip not found" }));
        }
    } catch (error) {
        console.error("Failed to update LED strip color:", error);
        ws.send(JSON.stringify({ action: 'updateLedStripColor', error: "Failed to update LED strip color" }));
    }
};

export const gameLedTrigger = async (ws, connection, payload) => {
    const { sensor_id } = payload;

    console.log(`Received payload: sensor_id = ${sensor_id}`);

    try {
        // Fetch the sensor name using sensor_id
        const [sensorRows] = await connection.execute(
            "SELECT sensor_name FROM sensor WHERE sensor_ID = ?",
            [sensor_id]
        );

        if (sensorRows.length === 0) {
            ws.send(JSON.stringify({
                action: 'gameLedTrigger',
                error: `No sensor found for sensor_id ${sensor_id}`
            }));
            return;
        }

        const sensorName = sensorRows[0].sensor_name;

        // Construct the ledstrip name
        const ledstripName = `ledstrip${sensorName}`;

        // Fetch the corresponding LED_strip_ID using the constructed ledstrip name
        const [ledStripRows] = await connection.execute(
            "SELECT LED_strip_ID FROM LED_strip WHERE LED_strip_name = ?",
            [ledstripName]
        );

        if (ledStripRows.length === 0) {
            ws.send(JSON.stringify({
                action: 'gameLedTrigger',
                error: `No LED strip found for ledstrip name ${ledstripName}`
            }));
            return;
        }

        const ledStripID = ledStripRows[0].LED_strip_ID;

        // Send the LED trigger command back to the client
        ws.send(JSON.stringify({
            action: 'gameLedTrigger',
            data: { ledStripID }
        }));
    } catch (error) {
        console.error("Failed to fetch LED strip ID:", error);
        ws.send(JSON.stringify({
            action: 'gameLedTrigger',
            error: "Failed to fetch LED strip ID"
        }));
    }
};

export const checkLEDOn = async (ws, connection) => {
    try {
        const [rows] = await connection.execute("SELECT * FROM led_on_status");
        ws.send(JSON.stringify({ action: 'checkLEDOn', data: rows }));
    } catch (error) {
        console.error(error);
        ws.send(JSON.stringify({ action: 'checkLEDOn', error: "Failed to fetch actions" }));
    }
};

