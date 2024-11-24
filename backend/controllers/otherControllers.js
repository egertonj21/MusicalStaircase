import { broadcast } from "../server.js";

export const getActions = async (ws, connection) => {
    try {
        const [rows] = await connection.execute("SELECT action_ID, sensor_ID, range_ID, note_ID FROM action_table");
        ws.send(JSON.stringify({ action: 'getActions', data: rows }));
    } catch (error) {
        console.error(error);
        ws.send(JSON.stringify({ action: 'getActions', error: "Failed to fetch actions" }));
    }
};

export const getRanges = async (ws, connection) => {
    try {
        const [rows] = await connection.execute("SELECT range_ID, range_name, lower_limit, upper_limit FROM sensor_range");
        const response = JSON.stringify({ action: 'getRanges', data: rows });
        console.log(`Sending response for getRanges: ${response}`);
        ws.send(response);
    } catch (error) {
        console.error(error);
        ws.send(JSON.stringify({ action: 'error', message: "Failed to fetch ranges" }));
    }
};

export const getNotes = async (ws, connection) => {
    try {
        const [rows] = await connection.execute("SELECT note_ID, note_name, note_location FROM note");
        const response = JSON.stringify({ action: 'getNotes', data: rows });
        console.log(`Sending response for getNotes: ${response}`);
        ws.send(response);
    } catch (error) {
        console.error(error);
        ws.send(JSON.stringify({ action: 'error', message: "Failed to fetch notes" }));
    }
};


export const getNoteDetails = async (ws, connection, payload) => {
    const { sensor_ID, range_ID, request_id } = payload;
    try {
        const [rows] = await connection.execute(
            `SELECT n.note_ID, n.note_name, n.note_location
             FROM note n
             JOIN action_table a ON n.note_ID = a.note_ID
             WHERE a.sensor_ID = ? AND a.range_ID = ?`,
            [sensor_ID, range_ID]
        );
        if (rows.length > 0) {
            ws.send(JSON.stringify({ action: 'getNoteDetails', data: rows[0], request_id: request_id }));
        } else {
            ws.send(JSON.stringify({ action: 'getNoteDetails', error: "Note details not found", request_id: request_id }));
        }
    } catch (error) {
        console.error(error);
        ws.send(JSON.stringify({ action: 'getNoteDetails', error: "Failed to fetch note details", request_id: request_id }));
    }
};


export const updateRange = async (ws, connection, payload) => {
    const { range_ID, range_name, lower_limit, upper_limit } = payload;

    if (!range_ID || !range_name || lower_limit === undefined || upper_limit === undefined) {
        ws.send(JSON.stringify({ action: 'updateRange', error: "Invalid input data" }));
        return;
    }

    try {
        const [result] = await connection.execute(
            "UPDATE sensor_range SET range_name = ?, lower_limit = ?, upper_limit = ? WHERE range_ID = ?",
            [range_name, lower_limit, upper_limit, range_ID]
        );

        if (result.affectedRows === 0) {
            ws.send(JSON.stringify({ action: 'updateRange', error: "Range not found" }));
        } else {
            ws.send(JSON.stringify({
                action: 'updateRange',
                message: "Range settings updated successfully",
                data: {
                    range_ID,
                    range_name,
                    lower_limit,
                    upper_limit
                }
            }));
        }
    } catch (error) {
        console.error("Failed to update range settings:", error);
        ws.send(JSON.stringify({ action: 'updateRange', error: "Failed to update range settings" }));
    }
};


export const getSensorLight = async (ws, connection) => {
    try {
        const [rows] = await connection.execute("SELECT * FROM sensor_light");
        ws.send(JSON.stringify({ action: 'getSensorLight', data: rows }));
    } catch (error) {
        console.error("Failed to fetch sensor_light entries:", error);
        ws.send(JSON.stringify({ action: 'getSensorLight', error: "Failed to fetch sensor_light entries" }));
    }
};

export const getSensorLightById = async (ws, connection, payload) => {
    const { id } = payload;
    try {
        const [rows] = await connection.execute("SELECT * FROM sensor_light WHERE LED_strip_ID = ?", [id]);
        if (rows.length > 0) {
            ws.send(JSON.stringify({ action: 'getSensorLightById', data: rows[0] }));
        } else {
            ws.send(JSON.stringify({ action: 'getSensorLightById', error: "Sensor light entry not found" }));
        }
    } catch (error) {
        console.error("Failed to fetch sensor_light entry:", error);
        ws.send(JSON.stringify({ action: 'getSensorLightById', error: "Failed to fetch sensor_light entry" }));
    }
};

export const createSensorLight = async (ws, connection, payload) => {
    const { sensor_ID, LED_strip_ID, range_ID, colour_ID } = payload;

    if (!sensor_ID || !LED_strip_ID || !range_ID || !colour_ID) {
        ws.send(JSON.stringify({ action: 'createSensorLight', error: "Invalid input data" }));
        return;
    }

    try {
        const [result] = await connection.execute(
            "INSERT INTO sensor_light (sensor_ID, LED_strip_ID, range_ID, colour_ID) VALUES (?, ?, ?, ?)",
            [sensor_ID, LED_strip_ID, range_ID, colour_ID]
        );
        ws.send(JSON.stringify({ action: 'createSensorLight', message: `Sensor light entry created with ID: ${result.insertId}` }));
    } catch (error) {
        console.error("Failed to create sensor_light entry:", error);
        ws.send(JSON.stringify({ action: 'createSensorLight', error: "Failed to create sensor_light entry" }));
    }
};

export const updateSensorLightColour = async (ws, connection, payload) => {
    const { LED_strip_ID, range_ID, colour_ID } = payload;

    if (!colour_ID) {
        ws.send(JSON.stringify({ action: 'updateSensorLightColour', error: "Invalid input data" }));
        return;
    }

    try {
        const [result] = await connection.execute(
            "UPDATE sensor_light SET colour_ID = ? WHERE LED_strip_ID = ? AND range_ID = ?",
            [colour_ID, LED_strip_ID, range_ID]
        );

        if (result.affectedRows === 0) {
            ws.send(JSON.stringify({ action: 'updateSensorLightColour', error: "Sensor light entry not found" }));
        } else {
            ws.send(JSON.stringify({ action: 'updateSensorLightColour', message: "Sensor light entry updated successfully" }));
        }
    } catch (error) {
        console.error("Failed to update sensor_light entry:", error);
        ws.send(JSON.stringify({ action: 'updateSensorLightColour', error: "Failed to update sensor_light entry" }));
    }
};

export const getSelectedOutput = async (ws, connection, payload) => {
    const { sensor_ID } = payload;
    try {
        const [rows] = await connection.execute(
            `SELECT at.range_ID, at.note_ID, at.sensor_ID
             FROM action_table at
             WHERE at.sensor_ID = ?`,
            [sensor_ID]
        );
        if (rows.length > 0) {
            ws.send(JSON.stringify({ action: 'getSelectedOutput', data: rows }));
        } else {
            ws.send(JSON.stringify({ action: 'getSelectedOutput', error: "No settings found for this sensor" }));
        }
    } catch (error) {
        console.error(error);
        ws.send(JSON.stringify({ action: 'getSelectedOutput', error: "Failed to fetch selected outputs" }));
    }
};

export const updateSelectedOutput = async (ws, connection, payload) => {
    const { sensor_ID, range_outputs } = payload;

    if (!sensor_ID || !Array.isArray(range_outputs)) {
        ws.send(JSON.stringify({ action: 'updateSelectedOutput', error: "Invalid input data" }));
        return;
    }

    try {
        for (const output of range_outputs) {
            const { range_ID, note_ID } = output;
            if (range_ID === undefined || note_ID === undefined) {
                ws.send(JSON.stringify({ action: 'updateSelectedOutput', error: "Invalid range_ID or note_ID" }));
                return;
            }

            const [rows] = await connection.execute(
                "SELECT 1 FROM action_table WHERE sensor_ID = ? AND range_ID = ?",
                [sensor_ID, range_ID]
            );

            if (rows.length > 0) {
                await connection.execute(
                    "UPDATE action_table SET note_ID = ? WHERE sensor_ID = ? AND range_ID = ?",
                    [note_ID, sensor_ID, range_ID]
                );
            } else {
                await connection.execute(
                    "INSERT INTO action_table (sensor_ID, range_ID, note_ID) VALUES (?, ?, ?)",
                    [sensor_ID, range_ID, note_ID]
                );
            }
        }

        ws.send(JSON.stringify({ action: 'updateSelectedOutput', message: "Selected outputs updated successfully" }));
    } catch (error) {
        console.error("Failed to update selected outputs:", error);
        ws.send(JSON.stringify({ action: 'updateSelectedOutput', error: "Failed to update selected outputs" }));
    }
};


export const getLightDurations = async (ws, connection) => {
    try {
        const [rows] = await connection.execute("SELECT * FROM light_duration");
        ws.send(JSON.stringify({ action: 'getLightDurations', data: rows }));
    } catch (error) {
        console.error("Failed to fetch light_duration entries:", error);
        ws.send(JSON.stringify({ action: 'getLightDurations', error: "Failed to fetch light_duration entries" }));
    }
};


export const createLightDuration = async (ws, connection, payload) => {
    const { duration } = payload;

    if (!duration) {
        ws.send(JSON.stringify({ action: 'createLightDuration', error: "Invalid input data" }));
        return;
    }

    try {
        // Delete all existing entries in the light_duration table
        await connection.execute("DELETE FROM light_duration");

        // Insert the new entry
        const [result] = await connection.execute(
            "INSERT INTO light_duration (duration) VALUES (?)",
            [duration]
        );
        ws.send(JSON.stringify({ action: 'createLightDuration', message: `Light duration entry created with ID: ${result.insertId}` }));
    } catch (error) {
        console.error("Failed to create light_duration entry:", error);
        ws.send(JSON.stringify({ action: 'createLightDuration', error: "Failed to create light_duration entry" }));
    }
};

export const getColours = async (ws, connection) => {
    try {
        const [rows] = await connection.execute("SELECT * FROM colour");
        ws.send(JSON.stringify({ action: 'getColours', data: rows }));
    } catch (error) {
        console.error(error);
        ws.send(JSON.stringify({ action: 'getColours', error: "Failed to fetch colours" }));
    }
};

export const getLogs = async (ws, connection) => {
    try {
        const [rows] = await connection.execute(
            `SELECT i.sensor_ID, s.sensor_name, i.distance, i.timestamp 
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
        const [rows] = await connection.execute("SELECT * FROM alive");  // Adjust the query as needed
        if (rows.length > 0) {
            ws.send(JSON.stringify({ action: 'getSensorStatus', data: rows }));
        } else {
            ws.send(JSON.stringify({ action: 'getSensorStatus', error: "Sensor not found" }));
        }
    } catch (error) {
        console.error("Failed to fetch sensor status:", error);
        ws.send(JSON.stringify({ action: 'getSensorStatus', error: "Failed to fetch sensor status" }));
    }
};

export const getAllSensorAwakeInfo = async (ws, connection) => {
    try {
        const [rows] = await connection.execute("SELECT * FROM all_sensors_status");
        ws.send(JSON.stringify({ action: 'getAllSensorAwakeInfo', data: rows }));
    } catch (error) {
        console.error("Failed to fetch sensor_light entries:", error);
        ws.send(JSON.stringify({ action: 'getAllSensorAwakeInfo', error: "Failed to fetch sensor_light entries" }));
    }
};

export const updateSensorStatus = async (ws, connection, payload) => {
    const { sensors_on } = payload;

    if (sensors_on === undefined) {
        ws.send(JSON.stringify({ action: 'updateSensorStatus', error: "Invalid input data" }));
        return;
    }

    try {
        // Delete all existing entries in the all_sensors_status table
        await connection.execute("DELETE FROM all_sensors_status");

        // Insert the new status
        const [result] = await connection.execute(
            "INSERT INTO all_sensors_status (sensors_on) VALUES (?)",
            [sensors_on]
        );

        ws.send(JSON.stringify({ action: 'updateSensorStatus', message: `Sensor status updated with ID: ${result.insertId}` }));
    } catch (error) {
        console.error("Failed to update sensor status:", error);
        ws.send(JSON.stringify({ action: 'updateSensorStatus', error: "Failed to update sensor status" }));
    }
};

export const getMute = async (ws, connection) => {
    try {
        const [rows] = await connection.execute("SELECT * FROM mute");
        ws.send(JSON.stringify({ action: 'getMute', data: rows }));
    } catch (error) {
        console.error("Failed to fetch sensor_light entries:", error);
        ws.send(JSON.stringify({ action: 'getMute', error: "Failed to fetch sensor_light entries" }));
    }
};

export const updateMute = async (ws, connection, payload) => {
    const { muted } = payload;

    if (muted === undefined) {
        ws.send(JSON.stringify({ action: 'updateMute', error: "Invalid input data" }));
        return;
    }

    try {
        // Delete all existing entries in the mute table
        await connection.execute("DELETE FROM mute");

        // Insert the new status
        const [result] = await connection.execute(
            "INSERT INTO mute (mute) VALUES (?)",  // Change 'muted' to 'mute' if that is the correct column name
            [muted]
        );

        ws.send(JSON.stringify({ action: 'updateMute', message: `Mute status updated with ID: ${result.insertId}` }));
    } catch (error) {
        console.error("Failed to update mute status:", error);
        ws.send(JSON.stringify({ action: 'updateMute', error: "Failed to update mute status" }));
    }
};
