import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import backgroundImage from './img/background3.webp';

const SensorLogs = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080'); // Replace with your server's IP address

    ws.onopen = () => {
      console.log('WebSocket connection established');
      ws.send(JSON.stringify({ action: 'getLogs' })); // Request initial logs
    };

    ws.onmessage = (event) => {
      try {
        console.log('WebSocket message received:', event.data);
        const data = JSON.parse(event.data);
        if (data.action === 'logSensorData') {
          setLogs(prevLogs => [data.data, ...prevLogs]); // Add new log entries to the beginning
        } else if (data.action === 'getLogs') {
          setLogs(data.data); // Set initial logs
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = (event) => {
      console.log('WebSocket connection closed:', event);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <>
      <Header />
      <div className="container" style={{ backgroundImage: `url(${backgroundImage})` }}>
        <h2>Sensor Logs</h2>
        <table>
          <thead>
            <tr>
              <th>Sensor Name</th>
              <th>Distance</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => (
              <tr key={index}>
                <td>{log.sensor_name}</td>
                <td>{log.distance}</td>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Footer />
    </>
  );
};

export default SensorLogs;
