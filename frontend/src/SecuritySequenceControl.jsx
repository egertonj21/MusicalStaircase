import React, { useState, useEffect } from 'react';
import Header from "./components/Header";
import Footer from "./components/Footer";
import backgroundImage from './img/background4.webp';

const SecuritySequenceControl = () => {
    const [sequences, setSequences] = useState([]);
    const [positions, setPositions] = useState([]);
    const [ws, setWs] = useState(null);

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8080'); // Replace with your server's address

        socket.onopen = () => {
            console.log('WebSocket connection opened');
            socket.send(JSON.stringify({ action: 'fetchAllSecuritySequences' }));
            socket.send(JSON.stringify({ action: 'fetchAllPositions' }));
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        socket.onclose = (event) => {
            console.log('WebSocket connection closed', event);
        };

        setWs(socket);

        return () => {
            if (socket) {
                socket.close();
            }
        };
    }, []);

    const handleWebSocketMessage = (data) => {
        console.log('WebSocket message received:', data);
        switch (data.action) {
            case 'fetchAllSecuritySequences':
                setSequences(data.data || []);
                break;
            case 'fetchAllPositions':
                setPositions(data.data || []);
                break;
            case 'updateSecuritySequence':
                // Refetch sequences after an update operation
                ws.send(JSON.stringify({ action: 'fetchAllSecuritySequences' }));
                break;
            default:
                console.error('Unknown action:', data.action);
        }
    };

    const handleUpdateSequence = (sequence_ID, updatedSequence) => {
        if (ws) {
            ws.send(JSON.stringify({ action: 'updateSecuritySequence', payload: { ...updatedSequence, sequence_ID } }));
        }
    };

    const handleInputChange = (e, field, sequence_ID) => {
        const updatedSequences = sequences.map(sequence => {
            if (sequence.sequence_ID === sequence_ID) {
                return { ...sequence, [field]: e.target.value };
            }
            return sequence;
        });
        setSequences(updatedSequences);
    };

    return (
        <div>
            <Header />
            <div className="security-container" style={{ backgroundImage: `url(${backgroundImage})` }}>
                <h2>Existing Security Sequence</h2>
                {sequences.map((sequence) => (
  <div key={sequence.sequence_ID}>
    
    <div>
      <label htmlFor={`direction-select-${sequence.sequence_ID}`}>Direction:</label>
      <select
        id={`direction-select-${sequence.sequence_ID}`}
        value={sequence.direction}
        onChange={(e) => handleInputChange(e, 'direction', sequence.sequence_ID)}
      >
        <option value="up">Up</option>
        <option value="down">Down</option>
      </select>
    </div>
    <div>
      <label htmlFor={`step1-select-${sequence.sequence_ID}`}>Step 1 Position:</label>
      <select
        id={`step1-select-${sequence.sequence_ID}`}
        value={sequence.step1_position_ID}
        onChange={(e) => handleInputChange(e, 'step1_position_ID', sequence.sequence_ID)}
      >
        <option value="">Select Position</option>
        {positions.map((position) => (
          <option key={position.position_ID} value={position.position_ID}>
            {position.position_name}
          </option>
        ))}
      </select>
    </div>
    <div>
      <label htmlFor={`step2-select-${sequence.sequence_ID}`}>Step 2 Position:</label>
      <select
        id={`step2-select-${sequence.sequence_ID}`}
        value={sequence.step2_position_ID}
        onChange={(e) => handleInputChange(e, 'step2_position_ID', sequence.sequence_ID)}
      >
        <option value="">Select Position</option>
        {positions.map((position) => (
          <option key={position.position_ID} value={position.position_ID}>
            {position.position_name}
          </option>
        ))}
      </select>
    </div>
    <div>
      <label htmlFor={`step3-select-${sequence.sequence_ID}`}>Step 3 Position:</label>
      <select
        id={`step3-select-${sequence.sequence_ID}`}
        value={sequence.step3_position_ID}
        onChange={(e) => handleInputChange(e, 'step3_position_ID', sequence.sequence_ID)}
      >
        <option value="">Select Position</option>
        {positions.map((position) => (
          <option key={position.position_ID} value={position.position_ID}>
            {position.position_name}
          </option>
        ))}
      </select>
    </div>
    <button onClick={() => handleUpdateSequence(sequence.sequence_ID, sequence)}>
      Update
    </button>
  </div>
))}

            </div>
            <Footer />
        </div>
    );
};

export default SecuritySequenceControl;
