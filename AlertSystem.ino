#include <DFRobot_MAX30102.h>
#include <Wire.h>
#include <WiFi.h>
#include <WebServer.h>

DFRobot_MAX30102 particleSensor;

// WiFi credentials - CHANGE THESE
const char* ssid = "0";
const char* password = "0";

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
String lastAlertTime = "";

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
  server.on("/", handleRoot);
  server.on("/data", handleData);
  server.enableCORS(true); // Enable CORS for local websites
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
        
        // Check for alert condition
        if (hrStdDev > 45 && !alertActive) {
          alertActive = true;
          lastAlertTime = String(millis() / 1000) + "s";
          Serial.println("ALERT: High variability detected!");
        } else if (hrStdDev <= 45) {
          alertActive = false;
        }
      }
    }
    
    // Print current values every time
    Serial.print(heartRate);
    Serial.print(",");
    Serial.print(hrStdDev);
    Serial.print(",");
    
    // Status indicator for demo (0=stable, 50=moderate, 100=high)
    int status = 0;
    if (hrStdDev < 50) {
      status = 0; // Stable/Normal
    } else if (hrStdDev < 80) {
      status = 50; // Moderate variability
    } else {
      status = 100; // High variability
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

// Web page handler
void handleRoot() {
  String html = "<!DOCTYPE html><html><head>";
  html += "<title>HRV Monitor</title>";
  html += "<meta name='viewport' content='width=device-width, initial-scale=1'>";
  html += "<style>";
  html += "body { font-family: Arial; text-align: center; padding: 20px; background: #1a1a1a; color: white; }";
  html += ".card { background: #2d2d2d; padding: 30px; border-radius: 15px; margin: 20px auto; max-width: 500px; }";
  html += ".value { font-size: 48px; font-weight: bold; margin: 20px 0; }";
  html += ".label { font-size: 18px; color: #888; }";
  html += ".alert { background: #ff4444; color: white; padding: 20px; border-radius: 10px; margin: 20px 0; font-size: 24px; }";
  html += ".normal { background: #44ff44; color: black; padding: 20px; border-radius: 10px; margin: 20px 0; font-size: 24px; }";
  html += "</style>";
  html += "<script>";
  html += "setInterval(function() {";
  html += "  fetch('/data').then(r => r.json()).then(data => {";
  html += "    document.getElementById('hr').innerText = data.heartRate;";
  html += "    document.getElementById('stddev').innerText = data.stdDev.toFixed(2);";
  html += "    if(data.alert) {";
  html += "      document.getElementById('status').className = 'alert';";
  html += "      document.getElementById('status').innerText = '⚠️ HIGH VARIABILITY ALERT';";
  html += "    } else {";
  html += "      document.getElementById('status').className = 'normal';";
  html += "      document.getElementById('status').innerText = '✓ Normal';";
  html += "    }";
  html += "  });";
  html += "}, 500);";
  html += "</script>";
  html += "</head><body>";
  html += "<h1>Heart Rate Variability Monitor</h1>";
  html += "<div class='card'>";
  html += "<div class='label'>Heart Rate</div>";
  html += "<div class='value' id='hr'>--</div>";
  html += "<div class='label'>Standard Deviation</div>";
  html += "<div class='value' id='stddev'>--</div>";
  html += "</div>";
  html += "<div id='status' class='normal'>Loading...</div>";
  html += "</body></html>";
  
  server.send(200, "text/html", html);
}

// JSON data endpoint
void handleData() {
  String json = "{";
  json += "\"heartRate\":" + String(heartRate) + ",";
  json += "\"stdDev\":" + String(hrStdDev) + ",";
  json += "\"alert\":" + String(alertActive ? "true" : "false");
  json += "}";
  
  server.send(200, "application/json", json);
}
