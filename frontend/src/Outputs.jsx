import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import backgroundImage from './img/background2.webp';

const Outputs = () => {
  const [sensors, setSensors] = useState([]);
  const [actions, setActions] = useState([]);
  const [ranges, setRanges] = useState([]);
  const [notes, setNotes] = useState([]);
  const [presets, setPresets] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");
  const [rangeOutputs, setRangeOutputs] = useState([]);
  const [currentSettings, setCurrentSettings] = useState([]);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");

    socket.onopen = () => {
      console.log("WebSocket connection opened");
      socket.send(JSON.stringify({ action: 'fetch_initial_data' }));
      socket.send(JSON.stringify({ action: 'fetchAllPresets' }));
    };

    socket.onmessage = event => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    socket.onerror = error => console.error("WebSocket error:", error);
    socket.onclose = () => console.log("WebSocket connection closed");

    setWs(socket);

    return () => {
      socket.close();
    };
  }, []);

  const handleWebSocketMessage = data => {
    console.log("WebSocket message received:", data);
    switch (data.action) {
      case "fetch_initial_data":
        setSensors(data.sensors || []);
        setActions(data.actions || []);
        setRanges(data.ranges || []);
        setNotes(data.notes || []);
        break;
      case "fetch_current_settings":
        console.log("Received current settings:", data.data);
        setCurrentSettings(data.data || []);
        setRangeOutputs(data.data || []);
        break;
      case "update_selected_outputs":
        alert("Selected outputs updated successfully");
        break;
      case "fetchAllPresets":
        setPresets(data.data || []);
        break;
      case "updateActionTableWithPreset":
        alert("Preset applied successfully");
        break;
      case "error":
        console.error("Error:", data.message);
        alert("Failed to update selected outputs");
        break;
      default:
        console.error("Unknown action:", data.action);
    }
  };

  const handleSensorChange = (sensorId) => {
    console.log("Selected sensor ID:", sensorId); // Debugging
    setSelectedSensor(sensorId);
    if (sensorId && ws) {
      const message = { action: 'fetch_current_settings', payload: { sensor_ID: sensorId } };
      console.log("Sending WebSocket message:", message); // Debugging
      ws.send(JSON.stringify(message));
    } else {
      setCurrentSettings([]);
      setRangeOutputs([]);
    }
  };

  const handleRangeOutputChange = (range_ID, note_ID) => {
    setRangeOutputs(prev => {
      const index = prev.findIndex(ro => ro.range_ID === range_ID);
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = { ...updated[index], note_ID };
        return updated;
      } else {
        return [...prev, { range_ID, note_ID }];
      }
    });
    setCurrentSettings(prev => {
      const index = prev.findIndex(cs => cs.range_ID === range_ID);
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = { ...updated[index], note_ID };
        return updated;
      } else {
        return [...prev, { range_ID, note_ID }];
      }
    });
  };

  const handleSubmit = () => {
    if (selectedSensor && ws) {
      const data = { action: 'updateSelectedOutput', payload: { sensor_ID: selectedSensor, range_outputs: rangeOutputs } };
      console.log("Submitting data:", data); // Debugging
      ws.send(JSON.stringify(data));
    } else {
      alert("No sensor selected");
    }
  };

  const handlePresetChange = (presetName) => {
    console.log("Selected preset name:", presetName); // Debugging
    setSelectedPreset(presetName);
  };

  const handleApplyPreset = () => {
    if (selectedPreset && ws) {
      const data = { action: 'updateActionTableWithPreset', payload: { preset_name: selectedPreset } };
      console.log("Applying preset with data:", data); // Debugging
      ws.send(JSON.stringify(data));
    } else {
      alert("No preset selected");
    }
  };

  const getNoteNameById = noteId => {
    const note = notes.find(n => n.note_ID === noteId);
    return note ? note.note_name : "None";
  };

  return (
    <>
      <Header />
      <div className="container" style={{ backgroundImage: `url(${backgroundImage})` }}>
        <h2>Note Selection</h2>
        <div className="form-group">
  <label id="dark" htmlFor="preset-select">Preset:</label>
  <select id="preset-select" value={selectedPreset} onChange={e => handlePresetChange(e.target.value)}>
    <option value="">Select a preset</option>
    {presets.map(preset => (
      <option key={preset.preset_ID} value={preset.preset_name}>{preset.preset_name}</option>
    ))}
  </select>
  <button onClick={handleApplyPreset}>Apply Preset</button>
</div>
<div className="form-group">
  <label id ="dark" htmlFor="sensor-select">Sensor:</label>
  <select id="sensor-select" value={selectedSensor} onChange={e => handleSensorChange(e.target.value)}>
    <option value="">Select a sensor</option>
    {sensors.map(sensor => (
      <option key={sensor.sensor_ID} value={sensor.sensor_ID}>{sensor.sensor_name}</option>
    ))}
  </select>
</div>
{ranges.map(range => (
  <div key={range.range_ID} className="form-group">
    <label id="dark" htmlFor={`range-select-${range.range_ID}`}>
      {range.range_name} (Current: {getNoteNameById(currentSettings.find(cs => cs.range_ID === range.range_ID)?.note_ID)}):
    </label>
    <select id={`range-select-${range.range_ID}`} onChange={e => handleRangeOutputChange(range.range_ID, e.target.value)}
            value={currentSettings.find(cs => cs.range_ID === range.range_ID)?.note_ID || ""}>
      <option value="">Select a note</option>
      {notes.map(note => (
        <option key={note.note_ID} value={note.note_ID}>{note.note_name}</option>
      ))}
    </select>
  </div>
))}

        <button onClick={handleSubmit}>Update Selected Outputs</button>
      </div>
      <Footer />
    </>
  );
};

export default Outputs;
