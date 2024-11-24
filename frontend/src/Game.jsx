import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import backgroundImage from './img/background4.webp';

const Game = () => {
  const [gameLength, setGameLength] = useState(0);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    // WebSocket connection setup
    const socket = new WebSocket('ws://localhost:8080'); // Replace with IP if needed

    socket.onopen = () => {
      console.log('WebSocket connection opened');
      socket.send(JSON.stringify({ action: 'fetchGameLength' }));
    };

    socket.onmessage = (event) => {
      console.log('WebSocket message received:', event.data);
      const data = JSON.parse(event.data);

      if (data.action === 'fetchGameLength') {
        if (data.data && data.data.length > 0) {
          setGameLength(data.data[0].length);
        }
      } else if (data.action === 'updateGameLength') {
        console.log("Game length updated:", data.message);
        // Optionally, you can fetch the updated length here
        socket.send(JSON.stringify({ action: 'fetchGameLength' }));
      }
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

  const updateGameLength = (newLength) => {
    if (newLength < 0) {
      alert("Game length cannot be negative.");
      return;
    }

    const data = {
      action: 'updateGameLength',
      payload: { length: newLength }
    };
    console.log("Updating game length with data:", data);

    // Send update to the server
    ws.send(JSON.stringify(data));
  };

  return (
    <>
      <Header />
      <div className="game-container" style={{ backgroundImage: `url(${backgroundImage})` }}>
        <h1>Sequence Length</h1>
        <div className="game-length-controls">
          <label htmlFor="game-length-input">Game Length:</label>
          <button onClick={() => updateGameLength(gameLength - 1)}>-</button>
          
          <input
            id="game-length-input"
            type="number"
            value={gameLength}
            onChange={(e) => setGameLength(parseInt(e.target.value))}
            onBlur={(e) => updateGameLength(parseInt(e.target.value))}
          />
          <button onClick={() => updateGameLength(gameLength + 1)}>+</button>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Game;
