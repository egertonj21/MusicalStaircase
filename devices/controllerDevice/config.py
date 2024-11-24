# Configuration settings
MQTT_BROKER = "192.168.0.93"
MQTT_PORT = 1883
MQTT_TOPICS = [
    "ultrasonic/distance_sensor1", 
    "ultrasonic/distance_sensor2", 
    "ultrasonic/distance_sensor3", 
    "ultrasonic/distance_sensor4", 
    "alive/distance_sensor1", 
    "alive/distance_sensor2", 
    "alive/distance_sensor3", 
    "alive/distance_sensor4",
    "alive/ledstrip1", 
    "alive/ledstrip2",
    "alive/ledstrip3",
    "alive/ledstrip4" # Add the new topic for LED strips
    # Add additional LED strip topics as needed
]
MQTT_MUTE_TOPIC = "audio/mute"  # New MQTT topic for mute control
CONTROL_TOPIC = "control/distance_sensor"
MOTION_CONTROL_TOPIC = "control/motion_sensor"

# Configuration Topics

CONFIG_RANGE_TOPIC = 'config/range_ledstrip'
CONFIG_TOPICS = [
	"control/ledstrip1",
	"control/ledstrip2",
	"control/ledstrip3",
	"control/ledstrip4",
	
	
]
CONFIG_LED_ON_TOPICS =[
	"control/led_on1",
	"control/led_on2",
	"control/led_on3",
	"control/led_on4"
]

# WebSocket server URL
WS_SERVER_IP = "192.168.0.37"  # Replace with your PC's IP address
WS_SERVER_URL = "ws://192.168.0.37:8080"

# Database settings
DB_HOST = '192.168.0.93'
DB_USER = 'joel'
DB_PASSWORD = '5Hitstain!'
DB_NAME = 'dissertation'
