export const fetchAllPositions = async (ws, connection) => {
    try {
        const [rows] = await connection.execute("SELECT * FROM position");
        ws.send(JSON.stringify({ action: 'fetchAllPositions', data: rows }));
    } catch (error) {
        console.error("Failed to fetch positions:", error);
        ws.send(JSON.stringify({ action: 'fetchAllPositions', error: "Failed to fetch positions" }));
    }
};

export const fetchAllSecuritySequences = async (ws, connection) => {
    try {
        const [rows] = await connection.execute("SELECT * FROM security_sequence");
        ws.send(JSON.stringify({ action: 'fetchAllSecuritySequences', data: rows }));
    } catch (error) {
        console.error("Failed to fetch security sequences:", error);
        ws.send(JSON.stringify({ action: 'fetchAllSecuritySequences', error: "Failed to fetch security sequences" }));
    }
};

export const addSecuritySequence = async (ws, connection, payload) => {
    const { direction, step1_position_ID, step2_position_ID, step3_position_ID } = payload;

    if (!direction || !step1_position_ID || !step2_position_ID || !step3_position_ID) {
        console.error("Invalid input data: direction or step position IDs are undefined");
        ws.send(JSON.stringify({ action: 'addSecuritySequence', error: "Invalid input data: direction or step position IDs are undefined" }));
        return;
    }

    try {
        await connection.execute(
            "INSERT INTO security_sequence (direction, step1_position_ID, step2_position_ID, step3_position_ID) VALUES (?, ?, ?, ?)",
            [direction, step1_position_ID, step2_position_ID, step3_position_ID]
        );
        ws.send(JSON.stringify({ action: 'addSecuritySequence', message: "Security sequence added successfully" }));
    } catch (error) {
        console.error("Failed to add security sequence:", error);
        ws.send(JSON.stringify({ action: 'addSecuritySequence', error: "Failed to add security sequence" }));
    }
};

export const updateSecuritySequence = async (ws, connection, payload) => {
    const { sequence_ID, direction, step1_position_ID, step2_position_ID, step3_position_ID } = payload;

    if (!sequence_ID || !direction || !step1_position_ID || !step2_position_ID || !step3_position_ID) {
        console.error("Invalid input data: sequence_ID, direction, or step position IDs are undefined");
        ws.send(JSON.stringify({ action: 'updateSecuritySequence', error: "Invalid input data: sequence_ID, direction, or step position IDs are undefined" }));
        return;
    }

    try {
        await connection.execute(
            "UPDATE security_sequence SET direction = ?, step1_position_ID = ?, step2_position_ID = ?, step3_position_ID = ? WHERE sequence_ID = ?",
            [direction, step1_position_ID, step2_position_ID, step3_position_ID, sequence_ID]
        );
        ws.send(JSON.stringify({ action: 'updateSecuritySequence', message: "Security sequence updated successfully" }));
    } catch (error) {
        console.error("Failed to update security sequence:", error);
        ws.send(JSON.stringify({ action: 'updateSecuritySequence', error: "Failed to update security sequence" }));
    }
};

export const deleteSecuritySequence = async (ws, connection, payload) => {
    const { sequence_ID } = payload;

    if (!sequence_ID) {
        console.error("Invalid input data: sequence_ID is undefined");
        ws.send(JSON.stringify({ action: 'deleteSecuritySequence', error: "Invalid input data: sequence_ID is undefined" }));
        return;
    }

    try {
        await connection.execute("DELETE FROM security_sequence WHERE sequence_ID = ?", [sequence_ID]);
        ws.send(JSON.stringify({ action: 'deleteSecuritySequence', message: "Security sequence deleted successfully" }));
    } catch (error) {
        console.error("Failed to delete security sequence:", error);
        ws.send(JSON.stringify({ action: 'deleteSecuritySequence', error: "Failed to delete security sequence" }));
    }
};
