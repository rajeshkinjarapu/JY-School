import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

interface AcademicYearContextType {
  academicYears: string[];
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  loading: boolean;
  refreshYears: () => Promise<void>;
  createAcademicYear: (newYear: string, cloneFromYear?: string) => Promise<boolean>;
}

const AcademicYearContext = createContext<AcademicYearContextType | undefined>(undefined);

export const AcademicYearProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [academicYears, setAcademicYears] = useState<string[]>(['2024-2025', '2025-2026', '2026-2027', '2027-2028']);
  const [selectedYear, setSelectedYearState] = useState<string>(() => {
    try {
      return localStorage.getItem('selected_academic_year') || '2026-2027';
    } catch {
      return '2026-2027';
    }
  });
  const [loading, setLoading] = useState<boolean>(true);

  const fetchYears = useCallback(async () => {
    try {
      const res = await api.get('/api/promotion/years');
      const data = res.data?.data || res.data;
      const years: string[] = data?.years || [];
      if (years.length > 0) {
        setAcademicYears(years);
        const stored = localStorage.getItem('selected_academic_year');
        if (!stored || !years.includes(stored)) {
          const defaultYear = data?.activeYear || (years.includes('2026-2027') ? '2026-2027' : years[0]);
          setSelectedYearState(defaultYear);
          localStorage.setItem('selected_academic_year', defaultYear);
        }
      }
    } catch (err) {
      console.warn('Could not fetch academic years, using defaults:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchYears();
  }, [fetchYears]);

  const setSelectedYear = (year: string) => {
    setSelectedYearState(year);
    localStorage.setItem('selected_academic_year', year);
    // Dispatch a window event so all components listening can react immediately
    window.dispatchEvent(new CustomEvent('academicYearChanged', { detail: { year } }));
  };

  const createAcademicYear = async (newYear: string, cloneFromYear?: string): Promise<boolean> => {
    const trimmedYear = newYear.trim();
    if (!trimmedYear) {
      toast.error('Please enter a valid academic year (e.g. 2027-2028)');
      return false;
    }

    try {
      // 1. If cloneFromYear is provided, call clone-classes
      const sourceYear = cloneFromYear || selectedYear;
      await api.post('/api/promotion/clone-classes', {
        fromAcademicYear: sourceYear,
        toAcademicYear: trimmedYear
      });

      toast.success(`Academic Year ${trimmedYear} created and classes initialized!`);
      await fetchYears();
      setSelectedYear(trimmedYear);
      return true;
    } catch (err: any) {
      // Fallback: create a single sample class to establish the new academic year
      try {
        await api.post('/api/classes', {
          name: '10th',
          section: 'A',
          academicYear: trimmedYear,
          capacity: 40
        });
        toast.success(`Academic Year ${trimmedYear} created successfully!`);
        await fetchYears();
        setSelectedYear(trimmedYear);
        return true;
      } catch (fallbackErr: any) {
        console.error('Failed to create academic year:', fallbackErr);
        toast.error(err?.response?.data?.message || 'Failed to create academic year');
        return false;
      }
    }
  };

  return (
    <AcademicYearContext.Provider
      value={{
        academicYears,
        selectedYear,
        setSelectedYear,
        loading,
        refreshYears: fetchYears,
        createAcademicYear,
      }}
    >
      {children}
    </AcademicYearContext.Provider>
  );
};

export const useAcademicYear = () => {
  const context = useContext(AcademicYearContext);
  if (!context) {
    throw new Error('useAcademicYear must be used within an AcademicYearProvider');
  }
  return context;
};
