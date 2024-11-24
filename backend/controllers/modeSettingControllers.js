export const fetchAllModes = async (ws, connection) => {
    try {
        const [rows] = await connection.execute("SELECT * FROM mode");
        ws.send(JSON.stringify({ action: 'fetchAllModes', data: rows }));
    } catch (error) {
        console.error("Failed to fetch modes:", error);
        ws.send(JSON.stringify({ action: 'fetchAllModes', error: "Failed to fetch modes" }));
    }
};

export const fetchActiveMode = async (ws, connection) => {
    try {
        const [rows] = await connection.execute("SELECT * FROM active_mode");
        if (rows.length > 0) {
            ws.send(JSON.stringify({ action: 'fetchActiveMode', data: rows[0] }));
        } else {
            ws.send(JSON.stringify({ action: 'fetchActiveMode', error: "No active mode found" }));
        }
    } catch (error) {
        console.error("Failed to fetch active mode:", error);
        ws.send(JSON.stringify({ action: 'fetchActiveMode', error: "Failed to fetch active mode" }));
    }
};

export const updateActiveMode = async (ws, connection, payload) => {
    const { mode_ID } = payload;

    if (!mode_ID) {
        console.error("Invalid input data: mode_ID is undefined");
        ws.send(JSON.stringify({ action: 'updateActiveMode', error: "Invalid input data: mode_ID is undefined" }));
        return;
    }

    try {
        const [rows] = await connection.execute("SELECT * FROM active_mode");
        if (rows.length > 0) {
            await connection.execute("UPDATE active_mode SET mode_ID = ? WHERE active_mode_ID = ?", [mode_ID, rows[0].active_mode_ID]);
        } else {
            await connection.execute("INSERT INTO active_mode (mode_ID) VALUES (?)", [mode_ID]);
        }
        ws.send(JSON.stringify({ action: 'updateActiveMode', message: "Active mode updated successfully" }));
    } catch (error) {
        console.error("Failed to update active mode:", error);
        ws.send(JSON.stringify({ action: 'updateActiveMode', error: "Failed to update active mode" }));
    }
};
