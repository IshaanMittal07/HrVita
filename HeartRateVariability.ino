#include <DFRobot_MAX30102.h>
#include <Wire.h>
#include <WiFi.h>
#include <WebServer.h>

DFRobot_MAX30102 particleSensor;

// WiFi credentials - CHANGE THESE
const char* ssid = "John";
const char* password = "p949zvp2";

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
  server.on("/", handleRoot);
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

// Web page handler
void handleRoot() {
  String html = F("<!DOCTYPE html><html><head>"
  "<meta charset='UTF-8'>"
  "<title>HRV Monitor</title>"
  "<meta name='viewport' content='width=device-width,initial-scale=1'>"
  "<style>"
  "*{margin:0;padding:0;box-sizing:border-box}"
  "body{font-family:'Segoe UI',Tahoma,sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;padding:20px;display:flex;align-items:center;justify-content:center}"
  ".container{background:#fff;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,0.3);padding:40px;max-width:600px;width:100%}"
  "h1{color:#333;font-size:32px;margin-bottom:30px;text-align:center;font-weight:600}"
  ".metrics{display:grid;grid-template-columns:1fr 1fr;gap:20px}"
  ".metric{background:linear-gradient(135deg,#f5f7fa 0%,#c3cfe2 100%);padding:25px;border-radius:15px;text-align:center;transition:transform 0.2s}"
  ".metric:hover{transform:translateY(-5px)}"
  ".metric-label{color:#666;font-size:14px;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;font-weight:500}"
  ".metric-value{color:#333;font-size:42px;font-weight:700}"
  ".metric-unit{color:#888;font-size:14px;margin-top:5px}"
  ".alert-box{margin-top:30px;padding:20px;border-radius:15px;text-align:center;font-size:18px;font-weight:600;display:none}"
  ".alert-box.show{display:block;animation:slideIn 0.3s}"
  ".alert-box.high{background:#f8d7da;color:#721c24;border:2px solid #f5c6cb}"
  ".alert-box.low{background:#fff3cd;color:#856404;border:2px solid #ffeaa7}"
  "@keyframes slideIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}"
  ".charts{margin-top:30px;display:grid;gap:20px}"
  ".chart-container{background:#f5f7fa;padding:20px;border-radius:15px}"
  ".chart-title{color:#333;font-size:16px;font-weight:600;margin-bottom:15px;text-align:center}"
  "canvas{width:100%!important;height:200px!important}"
  "</style>"
  "<script src='https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js'></script>"
  "<script>"
  "let hrData=[];let stdDevData=[];let labels=[];let maxPoints=30;"
  "let hrChart,stdDevChart;"
  "window.onload=()=>{"
  "hrChart=new Chart(document.getElementById('hrChart'),{type:'line',data:{labels:labels,datasets:[{label:'Heart Rate (BPM)',data:hrData,borderColor:'#667eea',backgroundColor:'rgba(102,126,234,0.1)',tension:0.4,fill:true}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:false}}}});"
  "stdDevChart=new Chart(document.getElementById('stdDevChart'),{type:'line',data:{labels:labels,datasets:[{label:'Std Deviation (ms)',data:stdDevData,borderColor:'#764ba2',backgroundColor:'rgba(118,75,162,0.1)',tension:0.4,fill:true}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}});"
  "};"
  "setInterval(()=>{"
  "fetch('/data').then(r=>r.json()).then(d=>{"
  "document.getElementById('hr').innerText=d.heartRate;"
  "document.getElementById('stddev').innerText=d.stdDev.toFixed(2);"
  "let a=document.getElementById('alert');"
  "if(d.alertType=='high'){a.className='alert-box show high';a.innerHTML='&#9888; High Variability Alert (StdDev > 45)'}else if(d.alertType=='low'){a.className='alert-box show low';a.innerHTML='&#9888; Low Variability Alert (StdDev < 16)'}else{a.className='alert-box'}"
  "let time=new Date().toLocaleTimeString();"
  "hrData.push(d.heartRate);stdDevData.push(d.stdDev);labels.push(time);"
  "if(hrData.length>maxPoints){hrData.shift();stdDevData.shift();labels.shift();}"
  "hrChart.update();stdDevChart.update();"
  "})},500)"
  "</script>"
  "</head><body>"
  "<div class='container'>"
  "<h1>Heart Rate Variability Monitor</h1>"
  "<div class='metrics'>"
  "<div class='metric'>"
  "<div class='metric-label'>Heart Rate</div>"
  "<div class='metric-value' id='hr'>--</div>"
  "<div class='metric-unit'>BPM</div>"
  "</div>"
  "<div class='metric'>"
  "<div class='metric-label'>Std Deviation</div>"
  "<div class='metric-value' id='stddev'>--</div>"
  "<div class='metric-unit'>ms</div>"
  "</div>"
  "</div>"
  "<div id='alert' class='alert-box'></div>"
  "</div>"
  "</body></html>");
  
  server.send(200, "text/html", html);
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
