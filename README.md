# HRVita 💙⌚

![HrVita Logo](HrVita.png)

HRVita is a lightweight wearable + web platform designed to **early-detect Hospital-Induced Delirium (HID)** using **Heart Rate Variability (HRV)** and provide **companionship support** for patients who often feel isolated or confused during hospitalization.

Try it here 👉 **[Web Dashboard](https://health-monitor-copy-93ebcfa8.base44.app)**   
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

## 🛠️ Tech Stack
**Hardware:** ESP32-C3, MAX30102, 3.7V LiPo Battery, Soldering  
**Software:** C++, WiFi/LAN, Data Analysis and Computation, Web Dashboard + AI Chatbot  


