
import { supabase } from './supabaseClient';
import { User, UserRole, EmergencyAlert, Inpatient, ScheduleItem, AdmissionStatus, MedicalRecord, PharmacyItem, Prescription, MedicalBoardMeeting } from '../types';

// Helper to map DB profile to User
const mapProfileToUser = async (profile: any): Promise<User> => {
    let medicalRecord: MedicalRecord | undefined = undefined;

    if (profile.role === UserRole.PATIENT) {
        const { data } = await supabase
            .from('medical_records')
            .select('*')
            .eq('user_id', profile.id)
            .single();

        if (data) {
            medicalRecord = {
                bloodType: data.blood_type,
                allergies: data.allergies,
                conditions: data.conditions,
                medications: data.medications,
                lastUpdated: data.last_updated
            };
        }
    }

    return {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        photo: profile.photo_url,
        medicalRecord
    };
};

export const api = {
    // Auth & User
    getCurrentUser: async (): Promise<User | null> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profile) return mapProfileToUser(profile);

        // Fallback: If profile is missing (e.g. trigger failed), use metadata and create it on the fly
        console.warn("Profile missing for user, attempting fallback creation/read.");
        const metaName = user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown User';
        const metaRole = (user.user_metadata?.role as UserRole) || UserRole.PATIENT;
        const metaPhoto = user.user_metadata?.photo || '';

        // Try to create it now if it doesn't exist
        const { error: insertError } = await supabase.from('profiles').insert({
            id: user.id,
            email: user.email!,
            name: metaName,
            role: metaRole,
            photo_url: metaPhoto
        });

        if (!insertError) {
            return {
                id: user.id,
                name: metaName,
                email: user.email!,
                role: metaRole,
                photo: metaPhoto
            };
        }

        // Even if insert fails (race condition?), return basic user object
        return {
            id: user.id,
            name: metaName,
            email: user.email || '',
            role: metaRole,
            photo: metaPhoto
        };
    },

    updateUserRole: async (userId: string, role: UserRole) => {
        const { error } = await supabase
            .from('profiles')
            .update({ role })
            .eq('id', userId);
        if (error) throw error;
    },

    updateUserProfile: async (userId: string, updates: Partial<User>) => {
        const profileUpdates: any = {};
        if (updates.name) profileUpdates.name = updates.name;
        if (updates.photo) profileUpdates.photo_url = updates.photo;

        if (Object.keys(profileUpdates).length > 0) {
            await supabase.from('profiles').update(profileUpdates).eq('id', userId);
        }

        if (updates.medicalRecord) {
            // Check if record exists
            const { data: existing } = await supabase
                .from('medical_records')
                .select('id')
                .eq('user_id', userId)
                .single();

            const recordData = {
                blood_type: updates.medicalRecord.bloodType,
                allergies: updates.medicalRecord.allergies,
                conditions: updates.medicalRecord.conditions,
                medications: updates.medicalRecord.medications,
                last_updated: new Date().toISOString()
            };

            if (existing) {
                await supabase.from('medical_records').update(recordData).eq('user_id', userId);
            } else {
                await supabase.from('medical_records').insert({ ...recordData, user_id: userId });
            }
        }
    },

    // Emergency Alerts
    getEmergencyAlerts: async (): Promise<EmergencyAlert[]> => {
        const { data, error } = await supabase
            .from('emergency_alerts')
            .select('*')
            .order('timestamp', { ascending: false });

        if (error) throw error;

        return data.map((alert: any) => ({
            id: alert.id,
            patientId: alert.patient_id || 'GUEST',
            patientName: alert.patient_name,
            age: alert.age,
            sex: alert.sex,
            incidentType: alert.incident_type,
            timestamp: alert.timestamp,
            location: {
                lat: alert.location_lat,
                lng: alert.location_lng
            },
            status: alert.status,
            medicalSummary: alert.medical_summary_snapshot
        }));
    },

    createEmergencyAlert: async (alert: Omit<EmergencyAlert, 'id' | 'status' | 'timestamp' | 'medicalSummary'>, medicalSummary: MedicalRecord) => {
        const { error } = await supabase.from('emergency_alerts').insert({
            patient_id: alert.patientId !== 'GUEST' ? alert.patientId : null,
            patient_name: alert.patientName,
            age: alert.age,
            sex: alert.sex,
            incident_type: alert.incidentType,
            location_lat: alert.location?.lat,
            location_lng: alert.location?.lng,
            medical_summary_snapshot: medicalSummary
        });
        if (error) throw error;
    },

    deleteEmergencyAlert: async (id: string) => {
        await supabase.from('emergency_alerts').delete().eq('id', id);
    },

    // Inpatients
    getInpatients: async (): Promise<Inpatient[]> => {
        const { data, error } = await supabase
            .from('inpatients')
            .select('*')
            .order('admission_date', { ascending: false });

        if (error) throw error;

        return data.map((p: any) => ({
            id: p.id,
            patientName: p.patient_name,
            dob: p.dob,
            status: p.status,
            admissionDate: p.admission_date,
            dischargeDate: p.discharge_date,
            ward: p.ward,
            attendingPhysician: 'Dr. On Duty', // Join with profiles if needed
            medicalSummary: p.medical_summary_snapshot
        }));
    },

    createInpatient: async (inpatient: Omit<Inpatient, 'id'>) => {
        await supabase.from('inpatients').insert({
            patient_name: inpatient.patientName,
            dob: inpatient.dob,
            status: inpatient.status,
            ward: inpatient.ward,
            medical_summary_snapshot: inpatient.medicalSummary,
            admission_date: inpatient.admissionDate
            // attending_physician_id: ...
        });
    },

    updateInpatientStatus: async (id: string, status: AdmissionStatus) => {
        const updates: any = { status };
        if (status === AdmissionStatus.DISCHARGED) {
            updates.discharge_date = new Date().toISOString();
        }
        await supabase.from('inpatients').update(updates).eq('id', id);
    },

    deleteInpatient: async (id: string) => {
        await supabase.from('inpatients').delete().eq('id', id);
    },

    updateInpatientMedicalRecord: async (inpatientId: string, record: MedicalRecord) => {
        await supabase.from('inpatients').update({
            medical_summary_snapshot: record
        }).eq('id', inpatientId);
    },

    // Pharmacy
    getPharmacyStock: async (): Promise<PharmacyItem[]> => {
        const { data, error } = await supabase.from('pharmacy_inventory').select('*').order('name');
        if (error) throw error;

        return data.map((item: any) => ({
            id: item.id,
            name: item.name,
            available: item.available,
            category: item.category,
            lastRestocked: item.last_restocked
        }));
    },

    updatePharmacyStock: async (items: PharmacyItem[]) => {
        // Upsert items (this is a bit simplistic, assumes ID matches)
        for (const item of items) {
            await supabase.from('pharmacy_inventory').upsert({
                id: item.id.length > 10 ? item.id : undefined, // Handle temp IDs from INITIAL_STOCK
                name: item.name,
                available: item.available,
                category: item.category,
                last_restocked: item.lastRestocked
            });
        }
    },

    // Prescriptions
    getPrescriptions: async (): Promise<Prescription[]> => {
        const { data, error } = await supabase.from('prescriptions').select('*').order('date', { ascending: false });
        if (error) throw error;

        return data.map((p: any) => ({
            id: p.id,
            medication: p.medication,
            dosage: p.dosage,
            status: p.status,
            prescribedBy: 'Doctor', // fetch name if needed
            date: p.date,
            patientId: p.patient_id,
            patientName: 'Patient' // fetch name if needed
        }));
    },

    updatePrescriptionStatus: async (id: string, status: Prescription['status']) => {
        await supabase.from('prescriptions').update({ status }).eq('id', id);
    },

    // Schedules
    getSchedules: async (): Promise<ScheduleItem[]> => {
        const { data, error } = await supabase.from('schedules').select('*');
        if (error) throw error;

        return data.map((s: any) => ({
            id: s.id,
            title: s.title,
            time: s.time_string,
            type: s.type,
            patientName: s.patient_name,
            location: s.location
        }));
    },

    createSchedule: async (schedule: Omit<ScheduleItem, 'id'>, doctorId: string) => {
        await supabase.from('schedules').insert({
            doctor_id: doctorId,
            title: schedule.title,
            time_string: schedule.time,
            type: schedule.type,
            patient_name: schedule.patientName,
            location: schedule.location
        });
    },

    // Board Meetings
    getBoardMeetings: async (): Promise<MedicalBoardMeeting[]> => {
        const { data, error } = await supabase.from('board_meetings').select('*');
        if (error) throw error;

        return data.map((m: any) => ({
            id: m.id,
            title: m.title,
            date: m.meeting_date,
            time: m.meeting_time,
            specialty: m.specialty,
            participants: [] // Need separate fetch if critical
        }));
    },

    createBoardMeeting: async (meeting: Omit<MedicalBoardMeeting, 'id'>) => {
        await supabase.from('board_meetings').insert({
            title: meeting.title,
            meeting_date: meeting.date,
            meeting_time: meeting.time,
            specialty: meeting.specialty
        });
    },

    deleteBoardMeeting: async (id: string) => {
        await supabase.from('board_meetings').delete().eq('id', id);
    }
};
