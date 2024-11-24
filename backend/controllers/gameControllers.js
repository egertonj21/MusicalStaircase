const fetchNoteDetails = async (connection, { sensor_ID, range_ID }) => {
    try {
        const [rows] = await connection.execute(
            `SELECT n.note_ID, n.note_name, n.note_location
             FROM note n
             JOIN action_table a ON n.note_ID = a.note_ID
             WHERE a.sensor_ID = ? AND a.range_ID = ?`,
            [sensor_ID, range_ID]
        );
        if (rows.length > 0) {
            return { data: rows[0] };
        } else {
            return { error: "Note details not found" };
        }
    } catch (error) {
        console.error('Error fetching note details:', error);
        return { error: "Failed to fetch note details" };
    }
};

// Function for handling game sequence payloads
export const handleGameSequencePayload = async (ws, connection, payload) => {
    try {
        const noteDetailsArray = [];
        const request_id = new Date().getTime(); // Generate a unique request_id

        for (let step of payload.sequence) {
            const [sensor_id, range_id] = step;

            // Fetch note details
            const noteDetails = await fetchNoteDetails(connection, { sensor_ID: sensor_id, range_ID: range_id });
            if (!noteDetails.error) {
                noteDetailsArray.push(noteDetails.data);
            } else {
                ws.send(JSON.stringify({ action: 'error', message: noteDetails.error }));
                return;
            }
        }

        // Send note details back to the client
        ws.send(JSON.stringify({ action: 'note_details', data: noteDetailsArray }));
        ws.send(JSON.stringify({ action: 'complete' }));
    } catch (error) {
        console.error('Error handling game sequence payload:', error);
        ws.send(JSON.stringify({ action: 'error', message: 'Failed to process game sequence payload' }));
    }
};


export const fetchGameLength = async (ws, connection) => {
    try {
        const [rows] = await connection.execute("SELECT * FROM game_length");
        ws.send(JSON.stringify({ action: 'fetchGameLength', data: rows }));
    } catch (error) {
        console.error("Failed to fetch game length:", error);
        ws.send(JSON.stringify({ action: 'fetchGameLength', error: "Failed to fetch game length" }));
    }
};

export const updateGameLength = async (ws, connection, payload) => {
    const { length } = payload;

    if (!length) {
        console.error("Invalid input data: length is undefined");
        ws.send(JSON.stringify({ action: 'updateGameLength', error: "Invalid input data: length is undefined" }));
        return;
    }

    try {
        await connection.execute(
            "UPDATE game_length SET length = ? WHERE length_ID = 1",
            [length]
        );
        ws.send(JSON.stringify({ action: 'updateGameLength', message: "Game Length updated successfully" }));
    } catch (error) {
        console.error("Failed to update Game Length:", error);
        ws.send(JSON.stringify({ action: 'updateGameLength', error: "Failed to update Game Length" }));
    }
};