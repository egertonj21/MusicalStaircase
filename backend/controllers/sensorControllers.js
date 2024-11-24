import { broadcast } from "../server.js";

export const getSensors = async (ws, connection) => {
    try {
        const [rows] = await connection.execute("SELECT sensor_ID, sensor_name FROM sensor");
        if (ws) {
            ws.send(JSON.stringify({ action: 'getSensors', data: rows }));
        } else {
            return rows;
        }
    } catch (error) {
        console.error(error);
        if (ws) {
            ws.send(JSON.stringify({ action: 'getSensors', error: "Failed to fetch sensors" }));
        } else {
            throw error;
        }
    }
};

export const getActions = async (connection) => {
    const [rows] = await connection.execute("SELECT action_ID, sensor_ID, range_ID, note_ID FROM action_table");
    return rows;
};

export const getRanges = async (connection) => {
    const [rows] = await connection.execute("SELECT range_ID, range_name, lower_limit, upper_limit FROM sensor_range");
    return rows;
};

export const getNotes = async (connection) => {
    const [rows] = await connection.execute("SELECT note_ID, note_name, note_location FROM note");
    return rows;
};

export const getCurrentSettings = async (ws, connection, payload) => {
    const { sensor_ID } = payload;

    if (!sensor_ID) {
        ws.send(JSON.stringify({ action: 'error', message: 'sensor_ID is required' }));
        return;
    }

    try {
        const [rows] = await connection.execute(
            `SELECT at.range_ID, at.note_ID 
             FROM action_table at 
             WHERE at.sensor_ID = ?`, 
            [sensor_ID]
        );

        ws.send(JSON.stringify({ action: 'fetch_current_settings', data: rows }));
    } catch (error) {
        console.error("Failed to fetch current settings:", error);
        ws.send(JSON.stringify({ action: 'error', message: error.message }));
    }
};

export const updateSelectedOutputs = async (connection, sensor_ID, range_outputs) => {
    await connection.execute("DELETE FROM action_table WHERE sensor_ID = ?", [sensor_ID]);
    const promises = range_outputs.map(output => 
        connection.execute(
            "INSERT INTO action_table (sensor_ID, range_ID, note_ID) VALUES (?, ?, ?)", 
            [sensor_ID, output.range_ID, output.note_ID]
        )
    );
    await Promise.all(promises);
};

export const logSensorData = async (ws, connection, payload) => {
    const { sensor_ID, distance } = payload;

    console.log(`Received payload: sensor_ID=${sensor_ID}, distance=${distance}`);

    // Validate the sensor_ID and distance
    if (sensor_ID === undefined || distance === undefined) {
        console.error("Invalid input data: sensor_ID or distance is undefined");
        ws.send(JSON.stringify({ action: 'logSensorData', error: "Invalid input data: sensor_ID or distance is undefined" }));
        return;
    }

    try {
        await connection.execute("INSERT INTO input (sensor_ID, distance, timestamp) VALUES (?, ?, NOW())", [sensor_ID, distance]);

        const [rows] = await connection.execute(
            `SELECT i.sensor_ID, s.sensor_name, i.distance, i.timestamp 
             FROM input i 
             JOIN sensor s ON i.sensor_ID = s.sensor_ID
             ORDER BY i.timestamp DESC
             LIMIT 10`
        );
        broadcast({ action: 'logSensorData', data: rows });

        ws.send(JSON.stringify({ action: 'logSensorData', message: "Sensor data logged successfully" }));
    } catch (error) {
        console.error("Failed to log sensor data:", error);
        ws.send(JSON.stringify({ action: 'logSensorData', error: "Failed to log sensor data" }));
    }
};

export const updateSensorStatus = async (ws, connection, payload) => {
    const { sensors_on } = payload;

    if (sensors_on === undefined) {
        console.error("Invalid input data: sensors_on is undefined");
        ws.send(JSON.stringify({ action: 'update_sensor_status', error: "Invalid input data: sensors_on is undefined" }));
        return;
    }

    try {
        await connection.execute("UPDATE alive SET awake = ?", [sensors_on]);
        ws.send(JSON.stringify({ action: 'update_sensor_status', data: { sensors_on } }));
    } catch (error) {
        console.error("Failed to update sensor status:", error);
        ws.send(JSON.stringify({ action: 'update_sensor_status', error: "Failed to update sensor status" }));
    }
};

export const updateSensorAlive = async (ws, connection, payload) => {
    const { sensors_on } = payload;

    if (sensors_on === undefined) {
        console.error("Invalid input data: sensors_on is undefined");
        ws.send(JSON.stringify({ action: 'update_sensor_status', error: "Invalid input data: sensors_on is undefined" }));
        return;
    }

    try {
        await connection.execute("UPDATE alive SET active = ?", [sensors_on]);
        ws.send(JSON.stringify({ action: 'update_sensor_status', data: { sensors_on } }));
    } catch (error) {
        console.error("Failed to update sensor status:", error);
        ws.send(JSON.stringify({ action: 'update_sensor_status', error: "Failed to update sensor status" }));
    }
};

export const fetchSensorRanges = async (ws, connection) => {
    try {
        const [rows] = await connection.execute("SELECT range_ID, lower_limit, upper_limit FROM sensor_range");
        ws.send(JSON.stringify({ action: 'fetchSensorRanges', data: rows }));
    } catch (error) {
        console.error("Failed to fetch sensor ranges:", error);
        ws.send(JSON.stringify({ action: 'fetchSensorRanges', error: "Failed to fetch sensor ranges" }));
    }
};

export const fetchLightDuration = async (ws, connection) => {
    try {
        const [rows] = await connection.execute("SELECT duration FROM light_duration WHERE light_duration_ID = 1");
        if (rows.length > 0) {
            ws.send(JSON.stringify({ action: 'fetchLightDuration', data: { duration: rows[0].duration } }));
        } else {
            ws.send(JSON.stringify({ action: 'fetchLightDuration', error: "No duration found" }));
        }
    } catch (error) {
        console.error("Failed to fetch light duration:", error);
        ws.send(JSON.stringify({ action: 'fetchLightDuration', error: "Failed to fetch light duration" }));
    }
};

export const controlSensor = async (ws, connection, payload) => {
    const { command } = payload;

    try {
        // Implement your logic for controlling the sensor here
        console.log(`Control command received: ${command}`);
        // For example, you can send this command to the actual sensor hardware

        ws.send(JSON.stringify({ action: 'controlSensor', message: `Command ${command} executed successfully` }));
    } catch (error) {
        console.error(`Failed to execute command ${command}:`, error);
        ws.send(JSON.stringify({ action: 'controlSensor', error: `Failed to execute command ${command}` }));
    }
};

export const controlMute = async (ws, connection, payload) => {
    const { command } = payload;

    try {
        console.log(`Mute control command received: ${command}`);
        // Implement your logic for controlling the mute functionality here

        ws.send(JSON.stringify({ action: 'controlMute', message: `Mute command ${command} executed successfully` }));
    } catch (error) {
        console.error(`Failed to execute mute command ${command}:`, error);
        ws.send(JSON.stringify({ action: 'controlMute', error: `Failed to execute mute command ${command}` }));
    }
};

export const getLogs = async (ws, connection) => {
    try {
        const [rows] = await connection.execute(
            `SELECT i.input_ID, s.sensor_name, i.distance, i.timestamp 
             FROM input i 
             JOIN sensor s ON i.sensor_ID = s.sensor_ID
             ORDER BY i.timestamp DESC
             LIMIT 20`
        );
        ws.send(JSON.stringify({ action: 'getLogs', data: rows }));
    } catch (error) {
        console.error("Failed to fetch logs:", error);
        ws.send(JSON.stringify({ action: 'getLogs', error: "Failed to fetch logs" }));
    }
};

export const getSensorStatus = async (ws, connection) => {
    try {
        const [rows] = await connection.execute("SELECT sensors_on FROM all_sensors_status LIMIT 1");
        if (rows.length > 0) {
            ws.send(JSON.stringify({ action: 'get_sensor_status', data: rows[0] }));
        } else {
            ws.send(JSON.stringify({ action: 'get_sensor_status', data: { sensors_on: 0 } }));
        }
    } catch (error) {
        console.error("Failed to fetch sensor status:", error);
        ws.send(JSON.stringify({ action: 'get_sensor_status', error: "Failed to fetch sensor status" }));
    }
};

export const getMuteStatus = async (ws, connection) => {
    try {
        const [rows] = await connection.execute("SELECT mute FROM mute LIMIT 1");
        if (rows.length > 0) {
            ws.send(JSON.stringify({ action: 'get_mute_status', data: rows[0] }));
        } else {
            ws.send(JSON.stringify({ action: 'get_mute_status', data: { mute: 0 } }));
        }
    } catch (error) {
        console.error("Failed to fetch mute status:", error);
        ws.send(JSON.stringify({ action: 'get_mute_status', error: "Failed to fetch mute status" }));
    }
};

export const updateMuteStatus = async (ws, connection, payload) => {
    const { mute } = payload;

    if (mute === undefined) {
        ws.send(JSON.stringify({ action: 'update_mute_status', error: "Invalid input data" }));
        return;
    }

    try {
        await connection.execute("DELETE FROM mute");

        const [result] = await connection.execute(
            "INSERT INTO mute (mute) VALUES (?)",
            [mute]
        );

        ws.send(JSON.stringify({ action: 'update_mute_status', data: { mute } }));
    } catch (error) {
        console.error("Failed to update mute status:", error);
        ws.send(JSON.stringify({ action: 'update_mute_status', error: "Failed to update mute status" }));
    }
};

export const fetchInitialData = async (ws, connection) => {
    try {
        const [sensors, actions, ranges, notes] = await Promise.all([
            getSensors(null, connection),
            getActions(connection),
            getRanges(connection),
            getNotes(connection)
        ]);
        ws.send(JSON.stringify({ 
            action: 'fetch_initial_data', 
            sensors, 
            actions, 
            ranges, 
            notes 
        }));
    } catch (error) {
        ws.send(JSON.stringify({ action: 'error', message: error.message }));
    }
};

export const fetchAllPresets = async (ws, connection) => {
    try {
        const [rows] = await connection.execute("SELECT * FROM preset_note");
        ws.send(JSON.stringify({ action: 'fetchAllPresets', data: rows }));
    } catch (error) {
        console.error("Failed to fetch preset notes:", error);
        ws.send(JSON.stringify({ action: 'fetchAllPresets', error: "Failed to fetch preset notes:" }));
    }
};

export const updateActionTableWithPreset = async (ws, connection, payload) => {
    const { preset_name } = payload;

    if (!preset_name) {
        ws.send(JSON.stringify({ action: 'updateActionTableWithPreset', error: "Invalid input data: preset_name is undefined" }));
        return;
    }

    try {
        // Fetch preset notes based on preset_name
        const [presetRows] = await connection.execute("SELECT * FROM preset_note WHERE preset_name = ?", [preset_name]);
        if (presetRows.length === 0) {
            ws.send(JSON.stringify({ action: 'updateActionTableWithPreset', error: "Invalid preset_name" }));
            return;
        }
        const preset = presetRows[0];

        // Fetch all positions
        const [positionRows] = await connection.execute("SELECT * FROM position");

        // Generate update queries based on the preset notes and positions
        const queries = [];
        for (const position of positionRows) {
            let note_ID;
            if (position.position_name === '1close') note_ID = preset['1close_note'];
            else if (position.position_name === '1mid') note_ID = preset['1mid_note'];
            else if (position.position_name === '1far') note_ID = preset['1far_note'];
            else if (position.position_name === '2close') note_ID = preset['2close_note'];
            else if (position.position_name === '2mid') note_ID = preset['2mid_note'];
            else if (position.position_name === '2far') note_ID = preset['2far_note'];
            else if (position.position_name === '3close') note_ID = preset['3close_note'];
            else if (position.position_name === '3mid') note_ID = preset['3mid_note'];
            else if (position.position_name === '3far') note_ID = preset['3far_note'];

            if (note_ID !== undefined) {
                queries.push(connection.execute(
                    "UPDATE action_table SET note_ID = ? WHERE sensor_ID = ? AND range_ID = ?",
                    [note_ID, position.sensor_ID, position.range_ID]
                ));
            }
        }

        // Execute all queries
        await Promise.all(queries);

        ws.send(JSON.stringify({ action: 'updateActionTableWithPreset', message: "Action table updated successfully" }));
    } catch (error) {
        console.error("Failed to update action table with preset:", error);
        ws.send(JSON.stringify({ action: 'updateActionTableWithPreset', error: "Failed to update action table with preset" }));
    }
};

