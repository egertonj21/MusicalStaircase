import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import backgroundImage from './img/background4.webp';

const Ranges = () => {
  const [ranges, setRanges] = useState([]);
  const [selectedRange, setSelectedRange] = useState("");
  const [rangeName, setRangeName] = useState("");
  const [lowerLimit, setLowerLimit] = useState("");
  const [upperLimit, setUpperLimit] = useState("");
  const [ws, setWs] = useState(null);

  useEffect(() => {
    // WebSocket connection setup
    const socket = new WebSocket('ws://localhost:8080'); // Replace with IP if needed

    socket.onopen = () => {
      console.log('WebSocket connection opened');
      socket.send(JSON.stringify({ action: 'getRanges' }));
    };

    socket.onmessage = (event) => {
      console.log('WebSocket message received:', event.data);
      const data = JSON.parse(event.data);

      if (data.action === 'getRanges') {
        setRanges(data.data || []);
        console.log("Fetched ranges:", data.data);
      } else if (data.action === 'updateRange') {
        setRanges((prevRanges) =>
          prevRanges.map((range) =>
            range.range_ID === data.data.range_ID
              ? { ...range, lower_limit: data.data.lower_limit, upper_limit: data.data.upper_limit }
              : range
          )
        );
        console.log("Updated ranges after WebSocket message:", data.data);
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

  const handleRangeChange = (event) => {
    const selected = ranges.find((range) => range.range_ID === parseInt(event.target.value));
    setSelectedRange(event.target.value);
    if (selected) {
      setRangeName(selected.range_name);
      setLowerLimit(selected.lower_limit);
      setUpperLimit(selected.upper_limit);
    } else {
      setRangeName("");
      setLowerLimit("");
      setUpperLimit("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedRange) {
      alert("Please select a range to update.");
      return;
    }
    const data = {
      action: 'updateRange',
      payload: {
        range_ID: parseInt(selectedRange),
        range_name: rangeName,
        lower_limit: lowerLimit,
        upper_limit: upperLimit,
      }
    };
    console.log("Updating range with data:", data);

    // Update the database
    ws.send(JSON.stringify(data));

    // Update the device's range settings
    if (selectedRange == 1 || selectedRange == 2) {
        const updateRangeSettingsData = {
            action: 'updateRangeSettings',
            payload: {
                closeUpperLimit: selectedRange == 1 ? upperLimit : undefined,
                midUpperLimit: selectedRange == 2 ? upperLimit : undefined
            }
        };
        console.log("Updating device range settings with data:", updateRangeSettingsData);
        ws.send(JSON.stringify(updateRangeSettingsData));
    }
};


  return (
    <>
      <Header />
      <div className="ranges-container" style={{ backgroundImage: `url(${backgroundImage})` }}>
        <h1>Update Range Settings</h1>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="rangeSelect">Select Range:</label>
            <select id="rangeSelect" value={selectedRange} onChange={handleRangeChange}>
              <option value="">--Select Range--</option>
              {ranges.length > 0 ? (
                ranges.map((range) => (
                  <option key={range.range_ID} value={range.range_ID}>
                    {range.range_name}
                  </option>
                ))
              ) : (
                <option value="">No ranges available</option>
              )}
            </select>
          </div>
          <div>
            <label htmlFor="lowerLimit">Lower Limit:</label>
            <input
              type="number"
              id="lowerLimit"
              value={lowerLimit}
              onChange={(e) => setLowerLimit(e.target.value)}
              required
              disabled={!selectedRange}
            />
          </div>
          <div>
            <label htmlFor="upperLimit">Upper Limit:</label>
            <input
              type="number"
              id="upperLimit"
              value={upperLimit}
              onChange={(e) => setUpperLimit(e.target.value)}
              required
              disabled={!selectedRange}
            />
          </div>
          <button className="button" type="submit" disabled={!selectedRange}>Update Range</button>
        </form>
      </div>
      <Footer />
    </>
  );
};

export default Ranges;
