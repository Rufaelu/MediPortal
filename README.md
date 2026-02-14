# 🏥 MediPortal

**Digital Records. Human Connection.**

MediPortal is a high-fidelity digital medical record and emergency response portal prototype. Designed for modern healthcare environments, it bridges the gap between patient data sovereignty and clinical actionability through a sleek, royal-blue aesthetic and AI-augmented triage.

---

## 🌟 Core Features

### 👤 Patient Ecosystem
- **Clinical Passport**: A centralized, secure vault for blood type, allergies, chronic conditions, and daily maintenance medications.
- **AI Symptom Intake**: Integrated **Gemini 1.5 Flash** engine (using `gemini-1.5-flash-preview`) that provides real-time clinical guidance and hospital navigation based on patient symptoms.
- **Identity Sync**: Real-time profile management with integrated camera support for high-resolution medical identification photos.
- **Pharmacy Tracker**: Live visibility into the hospital's medication stock levels and prescription status updates.

---

## 🚀 Getting Started

To run the MediPortal prototype locally:

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Configure Environment**:
    Create a `.env` or `.env.local` file in the root directory and add your Gemini API Key:
    ```env
    GEMINI_API_KEY=your_api_key_here
    ```

3.  **Start the Development Server**:
    ```bash
    npm run dev
    ```

4.  **Access the App**:
    Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠 Technology Stack

- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS (Utility-first design)
- **Intelligence**: Google Gemini API (`@google/genai`) - Powered by `gemini-1.5-flash-preview`
- **Icons**: Lucide React
- **Build Tool**: Vite 6
- **State Management**: React Hooks (useState/useEffect) + Web LocalStorage for prototype persistence.

---

## 🏗 System Architecture

MediPortal utilizes a centralized React state model to ensure real-time synchronization between roles:

1.  **Global App State**: Managed in `App.tsx`, tracking pharmacy inventory, inpatient registry, and active emergency alerts.
2.  **Role-Based Triage**: Conditional rendering based on the user's validated role (Patient, Doctor, Admin).
3.  **Local Persistence**: User sessions and medical records are synchronized with browser `localStorage`.

---

## 🎨 Design Philosophy

- **Color Palette**: Royal Blue (`#002366`) for authority and trust, contrasted with high-clarity slate-50 backgrounds.
- **Typography**: Inter (Geometric Sans-Serif) for maximum legibility.
- **Interactive Layers**: Glassmorphism, subtle CSS animations (floating, pulse-glow), and responsive grid systems to handle dense medical data.

---

## 🔐 Deployment & Security (Prototype)

- **AI Integration**: Uses `gemini-1.5-flash-preview` for low-latency, informative responses that prioritize patient safety without offering formal medical diagnoses.
- **Simulated Compliance**: Conceptual HIPAA-compliant visual indicators and data sovereignty workflows.
- **Persistence**: Session-based data stored locally in the browser's storage.


---

*MediPortal is a prototype designed to demonstrate the potential of AI-integrated healthcare management. All data is simulated for demonstration purposes.*