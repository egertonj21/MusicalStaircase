import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import icon from '../img/backdrop.webp';
import Switch from 'react-switch';

const Header = () => {
  const [wsClient, setWsClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAwake, setIsAwake] = useState(true); // Track the state of the sensor
  const [isMuted, setIsMuted] = useState(false); // Track the state of the mute
  const [isLEDOn, setIsLEDOn] = useState(false); // Track the state of the LED
  const [modes, setModes] = useState([]); // Track available modes
  const [activeMode, setActiveMode] = useState(''); // Track the current active mode

  useEffect(() => {
    
    // Connect to the WebSocket server
    const ws = new WebSocket('ws://localhost:8080'); // Replace with your server's IP address

    ws.onopen = () => {
      console.log('WebSocket connection established');
      setIsConnected(true);
      // Request initial statuses
      ws.send(JSON.stringify({ action: 'get_sensor_status' }));
      ws.send(JSON.stringify({ action: 'get_mute_status' }));
      ws.send(JSON.stringify({ action: 'checkLEDOn' }));
      ws.send(JSON.stringify({ action: 'fetchAllModes' }));
      ws.send(JSON.stringify({ action: 'fetchActiveMode' }));
    };

    ws.onmessage = (event) => {
      try {
        console.log('WebSocket message received:', event.data);
        const data = JSON.parse(event.data);

        if (data.type === 'alarm') {
          console.log('Alarm triggered!');
          // Trigger an alert when the alarm action is received
          alert('Security Alert: Alarm triggered on the staircase!');
        } else if (data.action === 'get_sensor_status') {
          setIsAwake(data.data.sensors_on === 1);
        } else if (data.action === 'get_mute_status') {
          setIsMuted(data.data.mute === 1);
        } else if (data.action === 'update_sensor_status') {
          setIsAwake(data.data.sensors_on === 1);
        } else if (data.action === 'update_mute_status') {
          setIsMuted(data.data.mute === 1);
        } else if (data.action === 'checkLEDOn') {
          setIsLEDOn(data.data[0].led_on === 1);
        } else if (data.action === 'fetchAllModes') {
          setModes(data.data);
        } else if (data.action === 'fetchActiveMode') {
          setActiveMode(data.data.mode_ID);
        } else if (data.action === 'updateActiveMode') {
          setActiveMode(data.payload.mode_ID);
        } else if (data.action === 'updateLEDStatus') {
          setIsLEDOn(data.data.led_on === 1);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = (event) => {
      console.log('WebSocket connection closed:', event);
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    setWsClient(ws);

    return () => {
      ws.close();
    };
  }, []);

  // Function to handle awake/asleep toggle
  const handleAwakeToggle = () => {
    if (isConnected && wsClient) {
      const command = isAwake ? 'sleep' : 'wake';
      console.log(`Sending command via WebSocket: ${command}`);
      wsClient.send(JSON.stringify({ action: 'sendControlMessage', payload: { action: command } }));

      // Update sensor awake status in the database
      wsClient.send(JSON.stringify({ action: 'updateSensorStatus', payload: { sensors_on: isAwake ? 0 : 1 } }));
    } else {
      console.error('WebSocket client is not connected');
    }
  };

  // Function to handle mute/unmute toggle
  const handleMuteToggle = () => {
    if (isConnected && wsClient) {
      const command = isMuted ? 'unmute' : 'mute';
      console.log(`Sending command via WebSocket: ${command}`);
      wsClient.send(JSON.stringify({ action: 'sendMuteMessage' }));

      // Update mute status in the database
      wsClient.send(JSON.stringify({ action: 'update_mute_status', payload: { mute: isMuted ? 0 : 1 } }));
    } else {
      console.error('WebSocket client is not connected');
    }
  };

  // Function to handle LED on/off toggle
  const handleLEDToggle = () => {
    if (isConnected && wsClient) {
      console.log('Toggling LED status');
      wsClient.send(JSON.stringify({ action: 'updateLEDStatus' }));
    } else {
      console.error('WebSocket client is not connected');
    }
  };

  // Function to handle mode change
  const handleModeChange = (event) => {
    const selectedMode = event.target.value;
    setActiveMode(selectedMode);
    if (isConnected && wsClient) {
      wsClient.send(JSON.stringify({ action: 'updateActiveMode', payload: { mode_ID: selectedMode } }));
    }
  };

  return (
    <div className="header">
      <div className="header-top">
        <div className="icon">
          <img src={icon} alt="Left Icon" className="header-icon" />
        </div>
        <div className="header-title">
          <h1>Musical Staircase</h1>
        </div>
        <div className="icon">
          <img src={icon} alt="Right Icon" className="header-icon" />
        </div>
      </div>
      <nav className="header-nav">
        <Link to="/">Home</Link>
        <Link to="/SensorLogs">Sensor Logs</Link>
        <Link to="/About">About</Link>
        <Link to="/Outputs">Notes</Link>
        <Link to="/Ranges">Range Settings</Link>
        <Link to="/LEDControl">LED Controls</Link>
        <Link to="/SecuritySequenceControl">Sentry Settings</Link>
        <Link to="/Game">Game</Link> 
        <div className="toggle-container">
          <label className="toggle-label" htmlFor="sensors-toggle">Sensors</label>
          <Switch
            id="sensors-toggle"
            onChange={handleAwakeToggle}
            checked={isAwake}
            offColor="#888"
            onColor="#0f0"
            uncheckedIcon={false}
            checkedIcon={false}
          />
          <span className="toggle-status">{isAwake ? 'Awake' : 'Asleep'}</span>
        </div>
        <div className="toggle-container">
          <label className="toggle-label" htmlFor="mute-toggle">Mute</label>
          <Switch
            id="mute-toggle"
            onChange={handleMuteToggle}
            checked={isMuted}
            offColor="#888"
            onColor="#f00"
            uncheckedIcon={false}
            checkedIcon={false}
          />
          <span className="toggle-status">{isMuted ? 'Muted' : 'Unmuted'}</span>
        </div>
        <div className="toggle-container">
          <label className="toggle-label" htmlFor="led-toggle">LEDs</label>
          <Switch
            id="led-toggle"
            onChange={handleLEDToggle}
            checked={isLEDOn}
            offColor="#888"
            onColor="#ff0"
            uncheckedIcon={false}
            checkedIcon={false}
          />
          <span className="toggle-status">{isLEDOn ? 'On' : 'Off'}</span>
        </div>
        <div className="dropdown-container">
          <label className="dropdown-label" htmlFor="mode-select">Select Mode</label>
          <select id="mode-select" value={activeMode} onChange={handleModeChange}>
            {modes.map((mode) => (
              <option key={mode.mode_id} value={mode.mode_id}>
                {mode.mode_name}
              </option>
            ))}
          </select>
        </div>
      </nav>
    </div>
  );
};

export default Header;
