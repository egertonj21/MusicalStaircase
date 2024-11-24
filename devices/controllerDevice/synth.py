import numpy as np
import pygame
import pygame.sndarray
import logging

# Initialize pygame mixer for synthesizing sound
pygame.mixer.init()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Base frequencies for each sensor
BASE_FREQUENCIES = {
    1: 440,  # A4
    2: 494,  # B4
    3: 523,  # C5
}

def synthesize_tone(frequency, duration, volume=0.5, sample_rate=44100):
    """Generate a synthesized tone with a given frequency and duration."""
    n_samples = int(sample_rate * duration)
    t = np.linspace(0, duration, n_samples, False)
    waveform = 0.5 * np.sin(2 * np.pi * frequency * t)
    
    # Ensure waveform is in the right format and apply volume
    waveform = np.int16(waveform * volume * 32767)
    sound = pygame.sndarray.make_sound(waveform)
    return sound

def play_synthesized_tone(sensor_id, distance):
    """Play a synthesized tone based on sensor ID and distance."""
    # Get the base frequency for the given sensor
    base_frequency = BASE_FREQUENCIES.get(sensor_id, 440)  # Default to A4 if sensor_id is not found
    max_distance = 50  # Maximum distance is 50 cm
    
    # Calculate the frequency based on the distance
    frequency = base_frequency * (1 + distance / max_distance)
    logger.info(f"Playing synthesized tone for sensor {sensor_id} at frequency {frequency:.2f} Hz")
    
    # Synthesize and play the tone
    duration = 1.0  # 1 second duration
    tone = synthesize_tone(frequency, duration)
    tone.play()

def stop_all_sounds():
    """Stop all currently playing sounds."""
    pygame.mixer.stop()

if __name__ == "__main__":
    # Example usage: Play tones for different sensors
    play_synthesized_tone(sensor_id=1, distance=25)  # Sensor 1 at 25 cm
    pygame.time.wait(1000)  # Wait for the sound to finish
    
    play_synthesized_tone(sensor_id=2, distance=50)  # Sensor 2 at 50 cm
    pygame.time.wait(1000)  # Wait for the sound to finish
    
    play_synthesized_tone(sensor_id=3, distance=10)  # Sensor 3 at 10 cm
    pygame.time.wait(1000)  # Wait for the sound to finish
