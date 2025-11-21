# HRVita — HRV-Based Delirium Detection & Companionship 💙⌚

Vita is a lightweight wearable + web platform designed to **early-detect Hospital-Induced Delirium (HID)** using **Heart Rate Variability (HRV)** and provide **companionship support** for patients who often feel isolated or confused during hospitalization.

Try it here 👉 **https://health-monitor-copy-93ebcfa8.base44.app**  
Default device IP: **172.20.10.4**

---

## 🚨 Why We Chose This Problem
### **Late Detection**
- HID is severely **underdiagnosed**—only **~4.42%** of cases are detected early.  
- Over **60–70%** of delirium cases go unnoticed, leading to longer hospital stays, cognitive decline, and higher mortality (Sources 1–2).

### **Companionship Matters**
- Delirious patients often feel **scared, isolated, and disoriented**.  
- Family involvement reduces delirium by **54%**, proving companionship is a key protective factor (Sources 3–4).  
- Vita includes a **chatbot + family dashboard** to support emotional well-being.

---

## 🧠 Research Snapshot
Studies show that **HRV + machine learning** (SVM, ELM, RBF kernels, etc.) can detect **~17.17%** of delirium cases early—comparable to full clinical models but with less data.  
This inspired our **real-time HRV wearable design**.

---

## 🔧 What We’ve Built
- 🟦 **ESP32 wearable** (C++)  
- 🔴 **Pulse oximeter sensor** (HR + HRV across 100-interval windows)  
- 🌐 **Web dashboard + companion chatbot**  
- 🧪 Fully wired + soldered hardware system  
- 📊 Stable HRV computation through serial monitor

---

## ⚠️ Current Challenges
- Sensor accuracy + placement sensitivity  
- Improving HRV calculation algorithms  
- Research-backed mapping: HRV patterns → HID risk  
- Bluetooth → website integration  
- Designing final wearable case

---

## 📅 Next Steps (Before Demo)
- 🔵 Add Bluetooth for real-time data streaming  
- 🔧 Tune sensor settings (LED brightness, sampling rate, ADC range, etc.)  
- 📦 Finalize wearable case design  
- 🧪 Run end-to-end integration tests  
- 🎤 Prepare final symposium presentation + demo

---

## 🛠️ Tech Stack
**Hardware:** ESP32, MAX30102, LiPo battery  
**Software:** C++, HRV algorithms, Web dashboard + chatbot  

---

## 📚 Works Cited  
1. CIBS Center (2024)  
2. Collier (2011)  
3. Healio (2025)  
4. Li (2024)  
5. Oh et al. (2017)  
6. Oh (2025)  
7. Tesfaye et al. (2025)  
8. Vandergriendt (2022)

---


![HrVita Logo](HrVita.png)
