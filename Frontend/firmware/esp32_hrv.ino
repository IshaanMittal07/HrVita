// Example ESP32 sketch that serves heart rate at GET /data as {"bpm": <number>}.
// Works with HrVita's "Connect to ESP32" button.
//
// Replace readHeartRate() with code for your sensor (e.g. MAX30102 or an
// analog pulse sensor). The rest can stay as-is.

#include <WiFi.h>
#include <WebServer.h>

const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

WebServer server(80);
float currentBpm = 0;

float readHeartRate() {
  // TODO: replace with real sensor code. Returns a fake value for testing.
  return 70 + random(-15, 16);
}

void handleData() {
  // CORS header lets the browser app read the response
  server.sendHeader("Access-Control-Allow-Origin", "*");
  String body = String("{\"bpm\":") + String(currentBpm, 0) + "}";
  server.send(200, "application/json", body);
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("ESP32 IP address: ");
  Serial.println(WiFi.localIP());   // enter this in HrVita

  server.on("/data", handleData);
  server.begin();
}

unsigned long lastRead = 0;

void loop() {
  server.handleClient();
  if (millis() - lastRead > 1000) {
    currentBpm = readHeartRate();
    lastRead = millis();
  }
}
