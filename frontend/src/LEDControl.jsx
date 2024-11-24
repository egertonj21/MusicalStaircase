import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import backgroundImage from "./img/background2.webp";

const LEDControl = () => {
  const [ledStrips, setLedStrips] = useState([]);
  const [ranges, setRanges] = useState([]);
  const [colours, setColours] = useState([]);
  const [sensorLights, setSensorLights] = useState([]);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080"); // Replace with your server's address

    socket.onopen = () => {
      console.log("WebSocket connection opened");
      socket.send(JSON.stringify({ action: "fetch_initial_led_data" }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onclose = (event) => {
      console.log("WebSocket connection closed", event);
    };

    setWs(socket);

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, []);

  const handleWebSocketMessage = (data) => {
    console.log("WebSocket message received:", data);
    switch (data.action) {
      case "fetch_initial_led_data":
        setLedStrips(data.ledStrips || []);
        setRanges(data.ranges || []);
        setColours(data.colours || []);
        setSensorLights(data.sensorLights || []);
        break;
      case "updateLedStripColor":
        setLedStrips((prev) =>
          prev.map((strip) =>
            strip.LED_strip_ID === data.ledStrip.LED_strip_ID
              ? data.ledStrip
              : strip
          )
        );
        break;
      default:
        console.error("Unknown action:", data.action);
    }
  };

  const handleSensorLightUpdate = (LED_strip_ID, range_ID, colour_ID) => {
    const ledStrip = ledStrips.find(
      (strip) => strip.LED_strip_ID === LED_strip_ID
    );
    if (ws && ledStrip) {
      const sensorName = ledStrip.LED_strip_name; // Use the actual sensor name from the ledStrips state
      console.log(
        `Updating sensor light for ${sensorName}, range_ID: ${range_ID}, colour_ID: ${colour_ID}`
      );

      // Send the update to the server
      ws.send(
        JSON.stringify({
          action: "updateSensorLightColour",
          payload: { LED_strip_ID, range_ID, colour_ID },
        })
      );

      // After updating the color, trigger the setLEDColors action
      ws.send(
        JSON.stringify({ action: "setLEDColors", payload: { sensorName } })
      );
    } else {
      console.error(
        `LED strip with ID ${LED_strip_ID} not found or WebSocket is not connected`
      );
    }
  };

  return (
    <div
      className="LED-container"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div>
        <Header />
        {ledStrips.map((ledStrip) => (
          <div key={ledStrip.LED_strip_ID}>
            <h2>LED Strip: {ledStrip.LED_strip_name}</h2>
            {ranges.map((range) => (
              <div key={range.range_ID}>
                <label
                  htmlFor={`colour-select-${ledStrip.LED_strip_ID}-${range.range_ID}`}
                >
                  Range {range.range_name} Colour:
                </label>
                <select
                  id={`colour-select-${ledStrip.LED_strip_ID}-${range.range_ID}`}
                  onChange={(e) =>
                    handleSensorLightUpdate(
                      ledStrip.LED_strip_ID,
                      range.range_ID,
                      e.target.value
                    )
                  }
                >
                  <option value="">Select Colour</option>
                  {colours.map((colour) => (
                    <option key={colour.colour_ID} value={colour.colour_ID}>
                      {colour.colour_name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        ))}

        <Footer />
      </div>
    </div>
  );
};

export default LEDControl;
