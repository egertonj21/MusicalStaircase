import express from "express";
import { WebSocketServer } from "ws";
import { createConnection } from "./dbconfig.js";
import cors from "cors";

const app = express();
const port = 3000;
app.use(express.json());
app.use(cors());

// Create WebSocket server
const wss = new WebSocketServer({ port: 8080 });

const init = async () => {
    let connection;
    try {
        // MySQL connection setup
        connection = await createConnection();

        // Define all routes that require DB connection inside here
        app.get("/sensors", async (req, res) => {
            try {
                const [rows] = await connection.execute("SELECT sensor_ID, sensor_name FROM sensor");
                res.json(rows);
            } catch (error) {
                console.error(error);
                res.status(500).send("Failed to fetch sensors");
            }
        });

        // Endpoint to update LED strip status
        app.put("/ledstrip/:id", async (req, res) => {
            const { id } = req.params;
            const { LED_strip_name, LED_alive, LED_active, colour_ID } = req.body;

            if (!LED_strip_name || LED_alive === undefined || LED_active === undefined || !colour_ID) {
                return res.status(400).send("Invalid input data");
            }

            try {
                const [result] = await connection.execute(
                    "UPDATE LED_strip SET LED_strip_name = ?, LED_alive = ?, LED_active = ?, colour_ID = ? WHERE LED_strip_ID = ?",
                    [LED_strip_name, LED_alive, LED_active, colour_ID, id]
                );

                if (result.affectedRows === 0) {
                    res.status(404).send("LED strip not found");
                } else {
                    res.send("LED strip updated successfully");
                }
            } catch (error) {
                console.error("Failed to update LED strip:", error);
                res.status(500).send("Failed to update LED strip");
            }
        });

        // Endpoint to get all LED strips
        app.get("/ledstrips", async (req, res) => {
            try {
                const [rows] = await connection.execute("SELECT * FROM LED_strip");
                res.json(rows);
            } catch (error) {
                console.error("Failed to fetch LED strips:", error);
                res.status(500).send("Failed to fetch LED strips");
            }
        });

        app.get("/actions", async (req, res) => {
            try {
                const [rows] = await connection.execute("SELECT action_ID, sensor_ID, range_ID, note_ID FROM action_table");
                res.json(rows);
            } catch (error) {
                console.error(error);
                res.status(500).send("Failed to fetch actions");
            }
        });

        app.get("/ranges", async (req, res) => {
            try {
                const [rows] = await connection.execute("SELECT range_ID, range_name, lower_limit, upper_limit FROM sensor_range");
                res.json(rows);
            } catch (error) {
                console.error(error);
                res.status(500).send("Failed to fetch ranges");
            }
        });

        app.get("/notes", async (req, res) => {
            try {
                const [rows] = await connection.execute("SELECT note_ID, note_name, note_location FROM note");
                res.json(rows);
            } catch (error) {
                console.error(error);
                res.status(500).send("Failed to fetch notes");
            }
        });

        app.get("/note-details/:sensor_ID/:range_ID", async (req, res) => {
            try {
                const { sensor_ID, range_ID } = req.params;
                const [rows] = await connection.execute(
                    `SELECT n.note_ID, n.note_name, n.note_location
                     FROM note n
                     JOIN action_table a ON n.note_ID = a.note_ID
                     WHERE a.sensor_ID = ? AND a.range_ID = ?`,
                    [sensor_ID, range_ID]
                );
                res.json(rows[0]);
            } catch (error) {
                console.error(error);
                res.status(500).send("Failed to fetch note details");
            }
        });

        app.put("/range/:range_ID", async (req, res) => {
            const { range_ID } = req.params;
            const { range_name, lower_limit, upper_limit } = req.body;

            if (!range_name || lower_limit === undefined || upper_limit === undefined) {
                return res.status(400).send("Invalid input data");
            }

            try {
                const [result] = await connection.execute(
                    "UPDATE sensor_range SET range_name = ?, lower_limit = ?, upper_limit = ? WHERE range_ID = ?",
                    [range_name, lower_limit, upper_limit, range_ID]
                );

                if (result.affectedRows === 0) {
                    res.status(404).send("Range not found");
                } else {
                    res.send("Range settings updated successfully");
                }
            } catch (error) {
                console.error("Failed to update range settings:", error);
                res.status(500).send("Failed to update range settings");
            }
        });

        app.post("/log-sensor-data", async (req, res) => {
            const { sensor_ID, distance } = req.body;
            try {
                await connection.execute("INSERT INTO input (sensor_ID, distance, timestamp) VALUES (?, ?, NOW())", [sensor_ID, distance]);

                // Fetch the latest sensor logs and broadcast to WebSocket clients
                const [rows] = await connection.execute(
                    `SELECT i.sensor_ID, s.sensor_name, i.distance, i.timestamp 
                     FROM input i 
                     JOIN sensor s ON i.sensor_ID = s.sensor_ID
                     ORDER BY i.timestamp DESC
                     LIMIT 10`
                );
                broadcast(rows);

                res.status(200).send("Sensor data logged successfully");
            } catch (error) {
                console.error("Failed to log sensor data:", error);
                if (!res.headersSent) {
                    res.status(500).send("Failed to log sensor data");
                }
            }
        });

        // Endpoint to get all sensor_light entries
        app.get("/sensor-light", async (req, res) => {
            try {
                const [rows] = await connection.execute("SELECT * FROM sensor_light");
                res.json(rows);
            } catch (error) {
                console.error("Failed to fetch sensor_light entries:", error);
                res.status(500).send("Failed to fetch sensor_light entries");
            }
        });

        // Endpoint to get a specific sensor_light entry by ID
        app.get("/sensor-light/:id", async (req, res) => {
            const { id } = req.params;
            try {
                const [rows] = await connection.execute("SELECT * FROM sensor_light WHERE sensor_light_ID = ?", [id]);
                if (rows.length > 0) {
                    res.json(rows[0]);
                } else {
                    res.status(404).send("Sensor light entry not found");
                }
            } catch (error) {
                console.error("Failed to fetch sensor_light entry:", error);
                res.status(500).send("Failed to fetch sensor_light entry");
            }
        });

        // Endpoint to create a new sensor_light entry
        app.post("/sensor-light", async (req, res) => {
            const { sensor_ID, LED_strip_ID, range_ID, colour_ID } = req.body;

            if (!sensor_ID || !LED_strip_ID || !range_ID || !colour_ID) {
                return res.status(400).send("Invalid input data");
            }

            try {
                const [result] = await connection.execute(
                    "INSERT INTO sensor_light (sensor_ID, LED_strip_ID, range_ID, colour_ID) VALUES (?, ?, ?, ?)",
                    [sensor_ID, LED_strip_ID, range_ID, colour_ID]
                );
                res.status(201).send(`Sensor light entry created with ID: ${result.insertId}`);
            } catch (error) {
                console.error("Failed to create sensor_light entry:", error);
                res.status(500).send("Failed to create sensor_light entry");
            }
        });

        // Endpoint to update an existing sensor_light entry by names
        app.put("/sensor-light/:name", async (req, res) => {
            const { name } = req.params;
            const { sensor_name, LED_strip_name, range_name, colour_name } = req.body;

            if (!sensor_name || !LED_strip_name || !range_name || !colour_name) {
                return res.status(400).send("Invalid input data");
            }

            try {
                const [[sensor]] = await connection.execute("SELECT sensor_ID FROM sensor WHERE sensor_name = ?", [sensor_name]);
                const [[ledStrip]] = await connection.execute("SELECT LED_strip_ID FROM LED_strip WHERE LED_strip_name = ?", [LED_strip_name]);
                const [[range]] = await connection.execute("SELECT range_ID FROM sensor_range WHERE range_name = ?", [range_name]);
                const [[colour]] = await connection.execute("SELECT colour_ID FROM colour WHERE colour_name = ?", [colour_name]);

                if (!sensor || !ledStrip || !range || !colour) {
                    return res.status(404).send("One or more specified names do not exist");
                }

                const [result] = await connection.execute(
                    "UPDATE sensor_light SET sensor_ID = ?, LED_strip_ID = ?, range_ID = ?, colour_ID = ? WHERE sensor_light_name = ?",
                    [sensor.sensor_ID, ledStrip.LED_strip_ID, range.range_ID, colour.colour_ID, name]
                );

                if (result.affectedRows === 0) {
                    res.status(404).send("Sensor light entry not found");
                } else {
                    res.send("Sensor light entry updated successfully");
                }
            } catch (error) {
                console.error("Failed to update sensor_light entry:", error);
                res.status(500).send("Failed to update sensor_light entry");
            }
        });

        app.get("/selected-output/:sensor_ID", async (req, res) => {
            const { sensor_ID } = req.params;
            try {
                const [rows] = await connection.execute(
                    `SELECT at.range_ID, at.note_ID, at.sensor_ID
                     FROM action_table at
                     WHERE at.sensor_ID = ?`,
                    [sensor_ID]
                );
                if (rows.length > 0) {
                    res.json(rows);
                } else {
                    res.status(404).send("No settings found for this sensor");
                }
            } catch (error) {
                console.error(error);
                res.status(500).send("Failed to fetch selected outputs");
            }
        });

        app.post("/selected-output/:sensor_ID", async (req, res) => {
            const { sensor_ID } = req.params;
            const { range_outputs } = req.body;

            if (!sensor_ID || !Array.isArray(range_outputs)) {
                return res.status(400).send("Invalid input data");
            }

            try {
                // Delete existing entries for the sensor
                const deleteResult = await connection.execute(
                    "DELETE FROM action_table WHERE sensor_ID = ?",
                    [sensor_ID]
                );
                console.log(`Deleted ${deleteResult[0].affectedRows} rows for sensor ID ${sensor_ID}`);

                // Insert new entries for the sensor if there are any range outputs specified
                if (range_outputs.length > 0) {
                    const insertPromises = range_outputs.map(output => {
                        if (output.range_ID && output.note_ID) { // Ensure that range_ID and note_ID are provided
                            return connection.execute(
                                "INSERT INTO action_table (sensor_ID, range_ID, note_ID) VALUES (?, ?, ?)",
                                [sensor_ID, output.range_ID, output.note_ID]
                            );
                        }
                        return Promise.reject(new Error("Missing range_ID or note_ID in some outputs"));
                    });

                    const insertResults = await Promise.all(insertPromises);
                    insertResults.forEach((result, index) => {
                        console.log(`Inserted row for range_ID ${range_outputs[index].range_ID} with note_ID ${range_outputs[index].note_ID}`);
                    });
                }

                res.send("Selected outputs updated successfully");
            } catch (error) {
                console.error("Failed to update selected outputs:", error);
                res.status(500).send("Failed to update selected outputs");
            }
        });

        // Endpoint to get all light_duration entries
        app.get("/light-durations", async (req, res) => {
            try {
                const [rows] = await connection.execute("SELECT * FROM light_duration");
                res.json(rows);
            } catch (error) {
                console.error("Failed to fetch light_duration entries:", error);
                res.status(500).send("Failed to fetch light_duration entries");
            }
        });

        // Endpoint to get a specific light_duration entry by ID
        app.get("/light-duration/:id", async (req, res) => {
            const { id } = req.params;
            try {
                const [rows] = await connection.execute("SELECT * FROM light_duration WHERE light_duration_ID = ?", [id]);
                if (rows.length > 0) {
                    res.json(rows[0]);
                } else {
                    res.status(404).send("Light duration entry not found");
                }
            } catch (error) {
                console.error("Failed to fetch light_duration entry:", error);
                res.status(500).send("Failed to fetch light_duration entry");
            }
        });

        // Endpoint to create a new light_duration entry
        app.post("/light-duration", async (req, res) => {
            const { duration } = req.body;

            if (!duration) {
                return res.status(400).send("Invalid input data");
            }

            try {
                const [result] = await connection.execute(
                    "INSERT INTO light_duration (duration) VALUES (?)",
                    [duration]
                );
                res.status(201).send(`Light duration entry created with ID: ${result.insertId}`);
            } catch (error) {
                console.error("Failed to create light_duration entry:", error);
                res.status(500).send("Failed to create light_duration entry");
            }
        });

        // Endpoint to update an existing light_duration entry by ID
        app.put("/light-duration/:id", async (req, res) => {
            const { id } = req.params;
            const { duration } = req.body;

            if (!duration) {
                return res.status(400).send("Invalid input data");
            }

            try {
                const [result] = await connection.execute(
                    "UPDATE light_duration SET duration = ? WHERE light_duration_ID = ?",
                    [duration, id]
                );

                if (result.affectedRows === 0) {
                    res.status(404).send("Light duration entry not found");
                } else {
                    res.send("Light duration entry updated successfully");
                }
            } catch (error) {
                console.error("Failed to update light_duration entry:", error);
                res.status(500).send("Failed to update light_duration entry");
            }
        });

        // Endpoint to get all colours
        app.get("/colours", async (req, res) => {
            try {
                const [rows] = await connection.execute("SELECT * FROM colour");
                res.json(rows);
            } catch (error) {
                console.error(error);
                res.status(500).send("Failed to fetch colours");
            }
        });

        app.get("/logs", async (req, res) => {
            try {
                const [rows] = await connection.execute(
                    `SELECT i.sensor_ID, s.sensor_name, i.distance, i.timestamp 
                     FROM input i 
                     JOIN sensor s ON i.sensor_ID = s.sensor_ID
                     ORDER BY i.timestamp DESC
                     LIMIT 20`
                );
                res.json(rows);
            } catch (error) {
                console.error("Failed to fetch logs:", error);
                res.status(500).send("Failed to fetch logs");
            }
        });

        // Endpoint to fetch the current awake status of a sensor
        app.get("/sensor-status", async (req, res) => {
            try {
                const [rows] = await connection.execute("SELECT sensor_ID, awake FROM alive WHERE sensor_ID = 3");  // Adjust the query as needed
                if (rows.length > 0) {
                    res.json(rows[0]);
                } else {
                    res.status(404).send("Sensor not found");
                }
            } catch (error) {
                console.error("Failed to fetch sensor status:", error);
                res.status(500).send("Failed to fetch sensor status");
            }
        });

        // Handle WebSocket connections
        wss.on('connection', async (ws) => {
            console.log('New client connected');

            // Send initial sensor status to the client
            try {
                const [rows] = await connection.execute("SELECT sensor_ID, awake FROM alive WHERE sensor_ID = 3");  // Adjust the query as needed
                if (rows.length > 0) {
                    ws.send(JSON.stringify({ type: 'sensor_status', awake: rows[0].awake, muted: false }));  // Replace false with actual mute status if you have it
                } else {
                    ws.send(JSON.stringify({ type: 'error', message: 'Sensor not found' }));
                }
            } catch (error) {
                console.error('Failed to fetch sensor status:', error);
                ws.send(JSON.stringify({ type: 'error', message: 'Failed to fetch sensor status' }));
            }

            ws.on('message', async (message) => {
                const data = JSON.parse(message);
                console.log('Received message:', data);

                if (data.action === 'get_sensor_status') {
                    try {
                        const [rows] = await connection.execute("SELECT sensor_ID, awake FROM alive WHERE sensor_ID = 3");  // Adjust the query as needed
                        if (rows.length > 0) {
                            ws.send(JSON.stringify({ type: 'sensor_status', awake: rows[0].awake, muted: false }));  // Replace false with actual mute status if you have it
                        } else {
                            ws.send(JSON.stringify({ type: 'error', message: 'Sensor not found' }));
                        }
                    } catch (error) {
                        console.error('Failed to fetch sensor status:', error);
                        ws.send(JSON.stringify({ type: 'error', message: 'Failed to fetch sensor status' }));
                    }
                } else if (data.action === 'sleep' || data.action === 'wake') {
                    const awake = data.action === 'wake';
                    try {
                        await connection.execute("UPDATE alive SET awake = ? WHERE sensor_ID = 3", [awake ? 1 : 0]);  // Adjust the query as needed
                        broadcast({ type: 'sensor_status', awake, muted: false });  // Replace false with actual mute status if you have it
                    } catch (error) {
                        console.error('Failed to update sensor status:', error);
                        ws.send(JSON.stringify({ type: 'error', message: 'Failed to update sensor status' }));
                    }
                } else if (data.action === 'mute' || data.action === 'unmute') {
                    const muted = data.action === 'mute';
                    // Update the mute status in the database or memory
                    broadcast({ type: 'sensor_status', awake: true, muted });  // Replace true with actual awake status if you have it
                }
            });

            ws.on('close', () => {
                console.log('Client disconnected');
            });
        });

        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });

    } catch (error) {
        console.error("Failed to initialize:", error);
    }
};

init();

const broadcast = (message) => {
    wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
};

export { broadcast };
