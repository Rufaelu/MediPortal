
import React, { useState, useEffect } from 'react';
import { User, UserRole, EmergencyAlert, Inpatient, ScheduleItem, AdmissionStatus, MedicalRecord, PharmacyItem, Prescription, MedicalBoardMeeting } from './types';
import LandingPage from './components/LandingPage';
import PatientDashboard from './components/PatientDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import AdminDashboard from './components/AdminDashboard';
import Navbar from './components/Navbar';

const INITIAL_PHARMACY_STOCK: PharmacyItem[] = [
  { id: 'st1', name: 'Acetaminophen', category: 'Analgesic', available: true, lastRestocked: new Date().toISOString() },
  { id: 'st2', name: 'Amoxicillin', category: 'Antibiotic', available: true, lastRestocked: new Date().toISOString() },
  { id: 'st3', name: 'Insulin Humalog', category: 'Metabolic', available: true, lastRestocked: new Date().toISOString() },
  { id: 'st4', name: 'Ventolin HFA', category: 'Respiratory', available: false, lastRestocked: new Date().toISOString() },
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<EmergencyAlert[]>([]);
  const [inpatients, setInpatients] = useState<Inpatient[]>([]);
  const [pharmacyStock, setPharmacyStock] = useState<PharmacyItem[]>(INITIAL_PHARMACY_STOCK);
  const [allPrescriptions, setAllPrescriptions] = useState<Prescription[]>([]);
  const [medicalBoardMeetings, setMedicalBoardMeetings] = useState<MedicalBoardMeeting[]>([]);
  
  const [schedules, setSchedules] = useState<ScheduleItem[]>([
    { id: 's1', title: 'Cardiac Surgery', time: '09:00 AM', type: 'SURGERY', patientName: 'Robert Chen', location: 'OR-4' },
    { id: 's2', title: 'ER Consultation', time: '11:30 AM', type: 'CONSULTATION', patientName: 'Sarah Jenkins', location: 'Exam Room 2' },
    { id: 's3', title: 'Ward Rounds', time: '02:00 PM', type: 'ROUNDS', location: 'Wing B' },
  ]);

  useEffect(() => {
    const savedUser = localStorage.getItem('mediportal_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('mediportal_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('mediportal_user');
  };

  const handleUpdateUser = (updates: Partial<User>) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
      localStorage.setItem('mediportal_user', JSON.stringify(updatedUser));
    }
  };

  const handleCreateEmergency = (alertData: Omit<EmergencyAlert, 'id' | 'status' | 'timestamp' | 'medicalSummary'>) => {
    const newAlert: EmergencyAlert = {
      ...alertData,
      id: Math.random().toString(36).substr(2, 9),
      status: 'ACTIVE',
      timestamp: new Date().toISOString(),
      medicalSummary: currentUser?.medicalRecord || {
        bloodType: 'Pending',
        allergies: 'Unknown',
        conditions: alertData.incidentType,
        medications: 'None',
        lastUpdated: new Date().toISOString()
      }
    };
    setActiveAlerts(prev => [newAlert, ...prev]);
  };

  const handleBookAppointment = (booking: Omit<ScheduleItem, 'id'>) => {
    const newSchedule: ScheduleItem = {
      ...booking,
      id: Math.random().toString(36).substr(2, 9),
    };
    setSchedules(prev => [...prev, newSchedule]);
  };

  const handleDeleteEmergency = (id: string) => {
    if (currentUser?.role !== UserRole.ADMIN) return;
    setActiveAlerts(prev => prev.filter(a => a.id !== id));
  };

  const handleAdmitPatient = (alert: EmergencyAlert) => {
    const newInpatient: Inpatient = {
      id: alert.patientId !== 'GUEST' ? alert.patientId : Math.random().toString(36).substr(2, 9),
      patientName: alert.patientName,
      status: AdmissionStatus.ON_THE_WAY,
      admissionDate: new Date().toISOString(),
      ward: 'ICU - West Wing',
      attendingPhysician: currentUser?.name || 'Dr. On Duty',
      medicalSummary: alert.medicalSummary
    };
    setInpatients(prev => [newInpatient, ...prev]);
    setActiveAlerts(prev => prev.filter(a => a.id !== alert.id));
  };

  const handleManualAdmit = (data: { name: string, status: AdmissionStatus, ward: string, bloodType: string, allergies: string, dob?: string, id?: string }) => {
    const newInpatient: Inpatient = {
      id: data.id || Math.random().toString(36).substr(2, 9),
      patientName: data.name,
      dob: data.dob,
      status: data.status,
      admissionDate: new Date().toISOString(),
      ward: data.ward,
      attendingPhysician: currentUser?.name || 'Dr. On Duty',
      medicalSummary: {
        bloodType: data.bloodType,
        allergies: data.allergies,
        conditions: 'Admitted via Registration/Manual Entry',
        medications: 'None recorded',
        lastUpdated: new Date().toISOString()
      }
    };
    setInpatients(prev => [newInpatient, ...prev]);
  };

  const handleDeleteInpatient = (id: string) => {
    if (currentUser?.role !== UserRole.ADMIN) return;
    setInpatients(prev => prev.filter(p => p.id !== id));
  };

  const handleUpdateInpatientStatus = (id: string, status: AdmissionStatus) => {
    setInpatients(prev => prev.map(p => 
      p.id === id ? { 
        ...p, 
        status, 
        dischargeDate: status === AdmissionStatus.DISCHARGED ? new Date().toISOString() : p.dischargeDate 
      } : p
    ));
  };

  const handleScheduleMeeting = (meeting: Omit<MedicalBoardMeeting, 'id'>) => {
    const newMeeting = { ...meeting, id: Math.random().toString(36).substr(2, 9) };
    setMedicalBoardMeetings(prev => [...prev, newMeeting]);
  };

  const handleDeleteMeeting = (id: string) => {
    if (currentUser?.role !== UserRole.ADMIN) return;
    setMedicalBoardMeetings(prev => prev.filter(m => m.id !== id));
  };

  const handleUpdateStock = (newStock: PharmacyItem[]) => setPharmacyStock(newStock);
  const handleUpdatePrescriptionStatus = (id: string, status: Prescription['status']) => {
    setAllPrescriptions(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  };

  const handleUpdatePatientRecordGlobal = (patientId: string, record: MedicalRecord) => {
    setInpatients(prev => prev.map(p => p.id === patientId ? { ...p, medicalSummary: record } : p));
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-x-hidden">
      {currentUser && (
        <>
          <div className="absolute top-20 right-[-20%] md:right-[-10%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] gradient-blue rounded-full glow-background pointer-events-none -z-10 opacity-[0.05]" />
          <div className="absolute bottom-[-10%] left-[-20%] md:left-[-10%] w-[400px] md:w-[800px] h-[400px] md:h-[800px] bg-blue-400 rounded-full glow-background pointer-events-none -z-10 opacity-[0.03]" />
        </>
      )}

      <Navbar user={currentUser} onLogout={handleLogout} onSwitchRole={(r) => handleUpdateUser({role: r})} />
      
      <main className="pt-20 relative z-10 w-full">
        {!currentUser ? (
          <LandingPage onLogin={handleLogin} />
        ) : currentUser.role === UserRole.PATIENT ? (
          <PatientDashboard 
            user={currentUser} 
            onUpdateRecord={(record) => handleUpdateUser({ medicalRecord: record })}
            onUpdateUser={handleUpdateUser}
            globalPharmacyStock={pharmacyStock}
            onCreateEmergency={handleCreateEmergency}
            onBookAppointment={handleBookAppointment}
            myAppointments={schedules.filter(s => s.patientName === currentUser.name)}
          />
        ) : currentUser.role === UserRole.DOCTOR ? (
          <DoctorDashboard 
            user={currentUser} 
            activeAlerts={activeAlerts} 
            inpatients={inpatients}
            schedules={schedules}
            boardMeetings={medicalBoardMeetings}
            onCreateEmergency={handleCreateEmergency}
            onAdmitPatient={handleAdmitPatient}
            onManualAdmit={handleManualAdmit}
            onUpdateInpatientStatus={handleUpdateInpatientStatus}
            onScheduleBoard={handleScheduleMeeting}
            onUpdateUser={handleUpdateUser}
          />
        ) : (
          <AdminDashboard 
            user={currentUser}
            activeAlerts={activeAlerts}
            inpatients={inpatients}
            schedules={schedules}
            boardMeetings={medicalBoardMeetings}
            pharmacyStock={pharmacyStock}
            allPrescriptions={allPrescriptions}
            onUpdateStock={handleUpdateStock}
            onUpdatePrescriptionStatus={handleUpdatePrescriptionStatus}
            onUpdatePatientRecord={handleUpdatePatientRecordGlobal}
            onDeleteEmergency={handleDeleteEmergency}
            onDeleteInpatient={handleDeleteInpatient}
            onDeleteMeeting={handleDeleteMeeting}
            onCreateEmergency={handleCreateEmergency}
            onRegisterPatient={handleManualAdmit}
          />
        )}
      </main>

      <footer className="bg-white/80 backdrop-blur-sm border-t py-8 mt-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-xs md:text-sm">
          &copy; 2024 MediPortal. Prototype medical system. All data simulated.
        </div>
      </footer>
    </div>
  );
};

export default App;
