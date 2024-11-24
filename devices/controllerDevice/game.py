import random
import websocket
import json
import logging
from config import WS_SERVER_URL

# Configure logging
logger = logging.getLogger(__name__)

positions = []

def fetch_game_length():
    try:
        ws = websocket.WebSocket()
        ws.connect(WS_SERVER_URL)
        payload = {"action": "fetchGameLength"}
        ws.send(json.dumps(payload))
        response = ws.recv()
        response_data = json.loads(response)
        ws.close()
        if response_data.get("action") == "fetchGameLength" and "data" in response_data:
            game_length_data = response_data["data"]
            if game_length_data:
                game_sequence_length = game_length_data[0].get("length", None)
                if game_sequence_length is not None:
                    print(f"Game Sequence Length: {game_sequence_length}")
                    return game_sequence_length
                else:
                    logger.error("Game length data received but 'length' field is missing")
                    return None
            else:
                logger.error("No game length data received")
                return None
        else:
            logger.error("Failed to fetch game length")
            return None
    except Exception as e:
        logger.error(f"Failed to fetch game length: {e}")
        return None

def fetch_all_positions():
    global positions
    try:
        ws = websocket.WebSocket()
        ws.connect(WS_SERVER_URL)
        payload = {"action": "fetchAllPositions"}
        ws.send(json.dumps(payload))
        response = ws.recv()
        response_data = json.loads(response)
        ws.close()
        if response_data.get("action") == "fetchAllPositions" and "data" in response_data:
            positions = response_data["data"]
            return positions
        else:
            logger.error("Failed to fetch positions")
            return []
    except Exception as e:
        logger.error(f"Failed to fetch positions: {e}")
        return []

def generate_sequence_from_first_step(first_step, positions):
    game_sequence_length = fetch_game_length()
    if game_sequence_length is None:
        logger.error("Unable to generate sequence: game length is not available")
        return []

    sequence = [first_step]
    sensor_id, range_id = first_step

    for _ in range(game_sequence_length - 1):
        last_sensor_id, last_range_id = sequence[-1]

        next_steps = [pos for pos in positions if 
                      pos['sensor_ID'] in {last_sensor_id - 1, last_sensor_id, last_sensor_id + 1} and
                      pos['range_ID'] in ({1, 2} if last_range_id == 1 else {1, 2, 3} if last_range_id == 2 else {2, 3}) and
                      (pos['sensor_ID'], pos['range_ID']) != (last_sensor_id, last_range_id)]

        if not next_steps:
            logger.error("Unable to generate sequence: no valid next steps found")
            return []

        next_step = random.choice(next_steps)
        sequence.append((next_step['sensor_ID'], next_step['range_ID']))

    return sequence


def map_position_id_to_sensor_range(position_id):
    for position in positions:
        if position["position_ID"] == position_id:
            return position["sensor_ID"], position["range_ID"]
    return None, None
    
    



