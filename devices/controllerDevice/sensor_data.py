import logging
import json
import time
import threading
import uuid
import websocket 
from playsound import playsound
from config import WS_SERVER_URL
from sound import last_played, COOLDOWN_PERIOD, play_sound
from utils import get_current_mode, fetch_security_sequences, fetch_all_positions
from game import generate_sequence_from_first_step
from synth import play_synthesized_tone, stop_all_sounds

# Configure logging
logger = logging.getLogger(__name__)

last_step = None
current_step_index = 0
game_sequence = []
security_sequences = fetch_security_sequences()
positions = fetch_all_positions()

def reset_user_steps():
    global current_step_index
    current_step_index = 0
    
def play_sound_effect(success):
    if success:
        playsound('/home/egertonj/Music/result.wav')
    else:
        playsound('/home/egertonj/Music/failure.wav')


def log_sensor_data(sensor_id, distance):
    try:
        ws = websocket.WebSocket()
        ws.connect(WS_SERVER_URL)
        payload = {
            "action": "logSensorData",
            "payload": {
                "sensor_ID": sensor_id,
                "distance": distance
            }
        }
        ws.send(json.dumps(payload))
        response = ws.recv()
        response_data = json.loads(response)
        logger.debug(f"Received response for logSensorData: {response_data}")
        if response_data.get("action") == "logSensorData" and "error" not in response_data:
            logger.info(f"Sensor data logged successfully for sensor {sensor_id}: {distance}")
        else:
            logger.error(f"Failed to log sensor data for sensor {sensor_id}: {response_data.get('error')}")
        ws.close()
    except websocket.WebSocketException as e:
        logger.error(f"WebSocket error: {e}")
    except Exception as e:
        logger.error(f"Failed to send data to server: {e}")

def determine_range_id(distance):
    from sound import ranges
    logger.debug(f"Determining range_id for distance: {distance}")
    for range_data in ranges:
        logger.debug(f"Checking range: {range_data}")
        if range_data['lower_limit'] <= distance < range_data['upper_limit']:
            logger.debug(f"Distance {distance} falls within range: {range_data}")
            return range_data['range_ID']
    logger.warning(f"No matching range found for distance: {distance}")
    return None

def send_request(ws, action, payload):
    request_id = str(uuid.uuid4())
    payload["request_id"] = request_id
    ws.send(json.dumps({"action": action, "payload": payload}))
    logger.debug(f"Sent request: {action}, payload: {payload}")
    return request_id

def receive_response(ws):
    response = json.loads(ws.recv())
    logger.debug(f"Received response: {response}")
    return response

def fetch_note_details(ws, sensor_id, range_id):
    payload = {
        "sensor_ID": sensor_id,
        "range_ID": range_id
    }
    request_id = send_request(ws, "getNoteDetails", payload)
    response = receive_response(ws)
    logger.debug(f"fetch_note_details - Sent request_id: {request_id}, Received response: {response}")
    if response.get("request_id") == request_id and response.get("action") == "getNoteDetails" and "data" in response:
        return response["data"]
    else:
        logger.warning(f"No note details found for sensor {sensor_id} at range {range_id}. Response: {response}")
        return None


def fetch_led_trigger_payload(ws, sensor_id, range_id):
    payload = {
        "sensor_id": sensor_id,
        "distance": range_id  # Correcting the payload to send distance
    }
    request_id = send_request(ws, "getLEDTriggerPayload", payload)
    response = receive_response(ws)
    logger.debug(f"fetch_led_trigger_payload - Sent request_id: {request_id}, Received response: {response}")
    if response.get("request_id") == request_id and response.get("action") == "LEDTrigger" and "payload" in response:
        return response["payload"]
    else:
        logger.warning(f"Failed to get LED trigger payload for sensor {sensor_id} at range {range_id}. Response: {response}")
        return None



def send_led_trigger(ws, sensor_id, led_trigger_payload):
    payload = {
        "sensor_id": sensor_id,
        "message": led_trigger_payload
    }
    request_id = send_request(ws, "sendLEDTrigger", payload)
    response = receive_response(ws)
    logger.debug(f"send_led_trigger - Sent request_id: {request_id}, Received response: {response}")
    if response.get("request_id") == request_id and response.get("action") == "LEDTrigger" and "message" in response:
        logger.info(f"Successfully sent LED trigger: {response['message']}")
    else:
        logger.error(f"Failed to send LED trigger for sensor {sensor_id}. Response: {response}")




def send_security_led_trigger(sensor_id, color):
    try:
        ws = websocket.WebSocket()
        ws.connect(WS_SERVER_URL)
        range_str = '0-30'
        duration = '3000'  # 3 seconds in milliseconds
        color_code = '0,0,0'

        if color == 'green':
            color_code = '0,255,0'  # RGB for green
        elif color == 'red':
            color_code = '255,0,0'  # RGB for red

        message = f"{range_str}&{color_code}&{duration}"
        payload = {
            "sensor_id": sensor_id,
            "message": message
        }
        request_id = send_request(ws, "sendLEDTrigger", payload)
        response = receive_response(ws)
        if response.get("request_id") == request_id and response.get("action") == "LEDTrigger" and "message" in response:
            logger.debug(f"LED Trigger message sent: {response['message']}")
        else:
            logger.warning(f"Failed to send LED trigger for sensor {sensor_id} with color {color}. Response: {response}")
        ws.close()
    except websocket.WebSocketException as e:
        logger.error(f"WebSocket error: {e}")
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {e} - Response content: {response}")
    except Exception as e:
        logger.error(f"Unexpected error in send_security_led_trigger: {e}")

def map_position_id_to_sensor_range(position_id):
    for position in positions:
        if position["position_ID"] == position_id:
            return position["sensor_ID"], position["range_ID"]
    return None, None

def check_security_sequence(sensor_id, range_id):
    global last_step, current_step_index

    security_sequences = get_security_sequences()

    current_step = (sensor_id, range_id)
    logger.debug(f"Current step: {current_step}")

    # Ignore repeated steps
    if current_step == last_step:
        return

    last_step = current_step

    for sequence in security_sequences:
        position_id = sequence[f"step{current_step_index + 1}_position_ID"]
        expected_sensor_id, expected_range_id = map_position_id_to_sensor_range(position_id)
        expected_step = (expected_sensor_id, expected_range_id)
        logger.debug(f"Expected step: {expected_step}")

        if current_step == expected_step:
            send_security_led_trigger(sensor_id, 'green')
            time.sleep(2)
            send_security_led_trigger(sensor_id, 'off')
            logger.info(f"Step {current_step_index + 1} matched, sent green light.")
            current_step_index += 1

            if current_step_index == 3:
                logger.info("Security sequence matched successfully.")
                reset_user_steps()
            return
        else:
            send_security_led_trigger(sensor_id, 'red')
            logger.info(f"Step {current_step_index + 1} did not match, sent red light.")
            time.sleep(2)
            send_security_led_trigger(sensor_id, 'off')
            
            # Send a WebSocket message to trigger a notification on the Flutter app
            send_alarm_notification(sensor_id)
            
            reset_user_steps()
            return
            
def send_alarm_notification(sensor_id):
    try:
        ws = websocket.WebSocket()
        ws.connect(WS_SERVER_URL)
        payload = {
            "type": "alarm",
            "sensor_id": sensor_id,
            "message": "fail"
        }
        ws.send(json.dumps(payload))
        logger.info(f"Alarm notification sent: {payload}")
        ws.close()
    except websocket.WebSocketException as e:
        logger.error(f"WebSocket error: {e}")
    except Exception as e:
        logger.error(f"Failed to send alarm notification: {e}")


def get_security_sequences():
    return fetch_security_sequences()

from synth import play_synthesized_tone, stop_all_sounds  # Import the new synth functions

def fetch_and_play_note_details(sensor_id, distance, is_muted):
    try:
        current_mode = get_current_mode()
        if current_mode is None:
            logger.error("Could not determine current mode, skipping processing.")
            return

        range_id = determine_range_id(distance)
        if range_id is None:
            logger.warning(f"No matching range found for distance: {distance}")
            return

        logger.debug(f"Fetching note details for sensor_id: {sensor_id}, range_id: {range_id}")
        ws = websocket.WebSocket()
        ws.connect(WS_SERVER_URL)
        note_details = fetch_note_details(ws, sensor_id, range_id)
        if note_details:
            logger.debug(f"Note details received: {note_details}")
            note_id = note_details.get("note_ID")

            log_sensor_data(sensor_id, distance)

            if current_mode == 1:  # Musical Stairs mode
                current_time = time.time()
                last_note, last_time = last_played.get(sensor_id, (None, 0))

                if (note_id != last_note or (current_time - last_time) > COOLDOWN_PERIOD) and not is_muted:
                    last_played[sensor_id] = (note_id, current_time)
                    threading.Thread(target=play_sound, args=(note_id,)).start()
                else:
                    logger.info(f"Skipping note {note_id} for sensor {sensor_id} due to cooldown or mute.")

            elif current_mode == 2:  # Security mode
                check_security_sequence(sensor_id, range_id)
                
            elif current_mode == 3:  # Game mode
                check_game_sequence(sensor_id, range_id, note_id)

            elif current_mode == 4:  # Synth Mode
                if not is_muted:
                    play_synthesized_tone(sensor_id, distance)
                else:
                    stop_all_sounds()

            # Add more modes as needed

        else:
            logger.warning(f"No note details found for sensor {sensor_id} at range {range_id}.")
        ws.close()
    except websocket.WebSocketException as e:
        logger.error(f"WebSocket error: {e}")
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {e} - Response content: {response}")
    except Exception as e:
        logger.error(f"Unexpected error in fetch_and_play_note_details: {e}")


def check_game_sequence(sensor_id, range_id, note_id):
    global last_step, current_step_index, game_sequence

    current_step = (sensor_id, range_id)
    if not game_sequence:
        game_sequence = generate_sequence_from_first_step(current_step, positions)
        logger.debug(f"Generated game sequence: {game_sequence}")
        display_sequence(game_sequence)

    logger.debug(f"Current step: {current_step}")

    # Ignore repeated steps
    if current_step == last_step:
        return

    last_step = current_step

    expected_step = game_sequence[current_step_index]
    expected_sensor_id, expected_range_id = expected_step
    logger.debug(f"Expected step: {expected_step}")

    ws = websocket.WebSocket()
    ws.connect(WS_SERVER_URL)

    try:
        if current_step == (expected_sensor_id, expected_range_id):
            logger.info(f"Step {current_step_index + 1} matched.")
            play_sound(note_id)
            current_step_index += 1

            if current_step_index == len(game_sequence):
                logger.info("Game sequence matched successfully.")
                flash_all_leds(ws, "0,255,0", 1)  # Flash green for success
                play_sound(56)
                reset_user_steps()
                game_sequence = []  # Reset the game sequence for the next round
        else:
            logger.info(f"Step {current_step_index + 1} did not match.")
            flash_all_leds(ws, "255,0,0", 1)  # Flash red for failure
            play_sound(55)
            time.sleep(2)
            reset_user_steps()
            game_sequence = []  # Reset the game sequence for the next round
    finally:
        ws.close()


def display_sequence(sequence):
    logger.info("Displaying the sequence to the user.")
    
    ws = websocket.WebSocket()
    ws.connect(WS_SERVER_URL)

    try:
        for step in sequence:
            sensor_id, range_id = step
            logger.debug(f"Processing step: sensor_id={sensor_id}, range_id={range_id}")
            
            # Fetch note details from the server
            payload = {
                "action": "getNoteDetails",
                "payload": {
                    "sensor_ID": sensor_id,
                    "range_ID": range_id
                }
            }
            ws.send(json.dumps(payload))
            response = json.loads(ws.recv())
            if response.get("action") == "getNoteDetails" and "data" in response:
                note_details = response["data"]
                note_id = note_details["note_ID"]
                play_sound(note_id)
            else:
                logger.warning(f"No note details found for sensor {sensor_id} at range {range_id}. Response: {response}")
                continue
            
            # Determine LED trigger message based on range_id
            if range_id == 1:
                led_range = "0-9"
            elif range_id == 2:
                led_range = "10-19"
            elif range_id == 3:
                led_range = "20-29"
            else:
                logger.warning(f"Unknown range_id: {range_id}")
                continue

            color = "0,255,0"  # Green color
            duration = 3  # Duration in seconds
            message = f"{led_range}&{color}&{duration}"
            logger.debug(f"Constructed LED trigger message: {message}")
            
            # Send the LED trigger message
            send_led_trigger(ws, sensor_id, message)
            
            time.sleep(1)  # Adjust the delay as needed

    except websocket.WebSocketException as e:
        logger.error(f"WebSocket error: {e}")

    finally:
        ws.close()
        
def flash_leds(ws, sensor_id, color, duration):
    try:
        range_str = '0-29'  # Full strip
        message = f"{range_str}&{color}&{duration}"
        send_led_trigger(ws, sensor_id, message)
    except Exception as e:
        logger.error(f"Error flashing LEDs for sensor {sensor_id}: {e}")
        
def flash_all_leds(ws, color, duration):
    try:
        sensor_ids = [1, 2, 3]  # Assuming you have 3 sensors/LED strips
        for sensor_id in sensor_ids:
            flash_leds(ws, sensor_id, color, duration)
    except Exception as e:
        logger.error(f"Error flashing all LEDs: {e}")

