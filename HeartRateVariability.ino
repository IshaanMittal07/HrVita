#include <DFRobot_MAX30102.h>
#include <Wire.h>
#include <WiFi.h>
#include <WebServer.h>

DFRobot_MAX30102 particleSensor;

// WiFi credentials - CHANGE THESE
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

WebServer server(80);

int32_t SPO2;
int32_t heartRate;
int8_t SPO2Valid;
int8_t heartRateValid;

// Store heart rate readings over 10 seconds
const int MAX_READINGS = 50; // 5 seconds worth, faster response
int32_t hrReadings[MAX_READINGS];
int readingIndex = 0;
int readingCount = 0;

float hrStdDev = 0;
bool alertActive = false;
String alertType = ""; // "high", "low", or ""

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
  
  // Connect to WiFi
  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
  
  // Setup web server endpoints
  server.on("/data", handleData);
  server.begin();
  Serial.println("Web server started");
  
  delay(2000);
}

void loop() {
  server.handleClient(); // Handle web requests
  
  unsigned long currentTime = millis();
  
  // Read heart rate every 100ms
  if (currentTime - lastReadTime >= 100) {
    lastReadTime = currentTime;
    
    particleSensor.heartrateAndOxygenSaturation(&SPO2, &SPO2Valid, &heartRate, &heartRateValid);
    
    // Store ALL readings (even if not perfect) to get faster response
    if (heartRate > 0 && heartRate < 200) {
      hrReadings[readingIndex] = heartRate;
      readingIndex = (readingIndex + 1) % MAX_READINGS;
      if (readingCount < MAX_READINGS) {
        readingCount++;
      }
      
      // Calculate standard deviation if we have enough data (just 5 readings = 0.5 sec)
      if (readingCount >= 5) {
        calculateStdDev();
        
        // Check for alert conditions
        if (hrStdDev > 45) {
          if (alertType != "high") {
            alertType = "high";
            alertActive = true;
            Serial.println("ALERT: High variability detected!");
          }
        } else if (hrStdDev < 16) {
          if (alertType != "low") {
            alertType = "low";
            alertActive = true;
            Serial.println("ALERT: Low variability detected!");
          }
        } else {
          alertType = "";
          alertActive = false;
        }
      }
    }
    
    // Print current values every time
    Serial.print(heartRate);
    Serial.print(",");
    Serial.print(hrStdDev);
    Serial.print(",");
    
    // Status indicator (0=normal, 50=low variability, 100=high variability)
    int status = 0;
    if (hrStdDev < 16) {
      status = 50; // Low variability alert
    } else if (hrStdDev > 45) {
      status = 100; // High variability alert
    }
    Serial.println(status);
  }
}

void calculateStdDev() {
  // Calculate mean
  float mean = 0;
  for (int i = 0; i < readingCount; i++) {
    mean += hrReadings[i];
  }
  mean /= readingCount;
  
  // Calculate standard deviation
  float sumSquaredDiff = 0;
  for (int i = 0; i < readingCount; i++) {
    float diff = hrReadings[i] - mean;
    sumSquaredDiff += diff * diff;
  }
  hrStdDev = sqrt(sumSquaredDiff / readingCount);
}

// JSON data endpoint
void handleData() {
  // Add CORS headers
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET");
  
  String json = "{";
  json += "\"heartRate\":" + String(heartRate) + ",";
  json += "\"stdDev\":" + String(hrStdDev) + ",";
  json += "\"alert\":" + String(alertActive ? "true" : "false") + ",";
  json += "\"alertType\":\"" + alertType + "\"";
  json += "}";
  
  server.send(200, "application/json", json);
}
