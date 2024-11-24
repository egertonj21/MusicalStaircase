import React from "react";
import { Link } from "react-router-dom";
import backgroundImage from '../img/image.webp';
import '../App.css';


function Body() {
  return (
    <div className="body" style={{ backgroundImage: `url(${backgroundImage})` }}>
      {/* <h1>Click Below to Navigate</h1>
      <ul>
        <li>
          <Link to="/SensorLogs">Sensor Logs</Link>
        </li>
        <li>
          <Link to="/Outputs">Outputs</Link>  
        </li>
        <li>
          <Link to="/About">About</Link>
        </li>
      </ul> */}
    </div>
  );
}

export default Body;