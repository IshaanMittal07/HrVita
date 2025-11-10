#include <DFRobot_MAX30102.h>
#include <Wire.h>

DFRobot_MAX30102 particleSensor;

int32_t SPO2;
int32_t heartRate;
int8_t SPO2Valid;
int8_t heartRateValid;

// Store heart rate readings over 10 seconds
const int MAX_READINGS = 100; // 10 seconds at 10Hz sampling
int32_t hrReadings[MAX_READINGS];
int readingIndex = 0;
int readingCount = 0;

float hrVariance = 0;

unsigned long lastReadTime = 0;

void setup() {
  Serial.begin(115200);
  while (!Serial) {
    ;
  }
  
  Wire.begin(6, 7); // SDA: GPIO6, SCL: GPIO7
  
  while (!particleSensor.begin()) {
    Serial.println("MAX30102 not found!");
    delay(1000);
  }
  
  particleSensor.sensorConfiguration(60, SAMPLEAVG_16, MODE_MULTILED,
                                    SAMPLERATE_1600, PULSEWIDTH_411,
                                    ADCRANGE_16384);
  
  // Initialize array
  for (int i = 0; i < MAX_READINGS; i++) {
    hrReadings[i] = 0;
  }
  
  delay(2000);
}

void loop() {
  unsigned long currentTime = millis();
  
  // Read heart rate every 100ms
  if (currentTime - lastReadTime >= 100) {
    lastReadTime = currentTime;
    
    particleSensor.heartrateAndOxygenSaturation(&SPO2, &SPO2Valid, &heartRate, &heartRateValid);
    
    // Only store valid readings
    if (heartRateValid == 1 && heartRate > 0 && heartRate < 200) {
      hrReadings[readingIndex] = heartRate;
      readingIndex = (readingIndex + 1) % MAX_READINGS;
      if (readingCount < MAX_READINGS) {
        readingCount++;
      }
      
      // Calculate variance if we have enough data
      if (readingCount >= 10) {
        calculateVariance();
      }
    }
    
    // Print current values
    Serial.print(heartRate);
    Serial.print(",");
    Serial.println(hrVariance);
  }
}

void calculateVariance() {
  // Calculate mean
  float mean = 0;
  for (int i = 0; i < readingCount; i++) {
    mean += hrReadings[i];
  }
  mean /= readingCount;
  
  // Calculate variance
  float sumSquaredDiff = 0;
  for (int i = 0; i < readingCount; i++) {
    float diff = hrReadings[i] - mean;
    sumSquaredDiff += diff * diff;
  }
  hrVariance = sumSquaredDiff / readingCount;
}
