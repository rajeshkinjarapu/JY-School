import React, { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { QRCodeSVG } from "qrcode.react";
import { Printer, Loader } from "lucide-react";
import api from "../../../api/axios";

export const OMRTemplateGenerator: React.FC = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get("/api/exams").then((res: any) => setExams(res.data));
  }, []);

  const handleFetchStudents = async () => {
    if (!selectedClassId) return;
    setLoading(true);
    try {
      const res: any = await api.get(`/api/classes/${selectedClassId}/students`);
      setStudents(res.data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "OMR_Sheets",
  });

  const selectedExam = exams.find(e => e.id === selectedExamId);
  const selectedClass = selectedExam?.classes?.find((c: any) => c.id === selectedClassId);

  return (
    <div className="page-container bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">OMR Template Generator</h2>
          <p className="text-sm text-gray-500">Generate 75-Question OMR sheets for students</p>
        </div>
        <button onClick={() => handlePrint()} className="btn-primary">
          <Printer size={18} /> Print OMRs
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="label">Select Exam</label>
          <select className="input" value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)}>
            <option value="">-- Select Exam --</option>
            {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Select Class</label>
          <select className="input" value={selectedClassId} onChange={e => {
            setSelectedClassId(e.target.value);
          }}>
            <option value="">-- Select Class --</option>
            {selectedExam?.classes?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <button onClick={handleFetchStudents} className="btn-secondary w-full" disabled={loading}>
            {loading ? <Loader className="animate-spin" size={18} /> : "Fetch Students"}
          </button>
        </div>
      </div>

      {/* Hidden Print Area */}
      <div className="hidden">
        <div ref={printRef} className="print-area">
          {students.map((student, index) => (
            <div key={student.id} className="omr-page" style={{ pageBreakAfter: "always", padding: "20px", position: "relative", minHeight: "1120px" }}>
              {/* Top Left Fiducial */}
              <div style={{ position: "absolute", top: 20, left: 20, width: 30, height: 30, backgroundColor: "black" }} />
              {/* Top Right Fiducial */}
              <div style={{ position: "absolute", top: 20, right: 20, width: 30, height: 30, backgroundColor: "black" }} />
              
              <div style={{ textAlign: "center", marginTop: "40px" }}>
                <h2>{selectedExam?.name} - OMR Response Sheet</h2>
                <div style={{ display: "flex", justifyContent: "space-between", margin: "20px 40px" }}>
                  <div style={{ textAlign: "left" }}>
                    <p><strong>Name:</strong> {student.name}</p>
                    <p><strong>Roll No:</strong> {student.rollNumber}</p>
                    <p><strong>Class:</strong> {selectedClass?.name}</p>
                  </div>
                  <div>
                    <QRCodeSVG value={JSON.stringify({ s: student.id, e: selectedExamId, c: selectedClassId })} size={80} />
                  </div>
                </div>

                {/* 75 Bubbles Grid */}
                <div style={{ display: "flex", justifyContent: "space-between", margin: "40px auto", maxWidth: "800px" }}>
                  {/* Column 1: Maths (1-25) */}
                  <div style={{ flex: 1, padding: "0 20px" }}>
                    <h3 style={{ borderBottom: "2px solid #000", paddingBottom: "5px", marginBottom: "15px" }}>Maths (1-25)</h3>
                    {Array.from({ length: 25 }).map((_, i) => {
                      const qNum = i + 1;
                      return (
                        <div key={qNum} style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                          <span style={{ width: "30px", fontWeight: "bold", textAlign: "right", marginRight: "10px" }}>{qNum}.</span>
                          {["A", "B", "C", "D"].map(opt => (
                            <div key={opt} style={{ width: "24px", height: "24px", borderRadius: "50%", border: "2px solid #000", display: "flex", alignItems: "center", justifyContent: "center", marginRight: "8px", fontSize: "12px" }}>
                              {opt}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>

                  {/* Column 2: Physics (26-50) */}
                  <div style={{ flex: 1, padding: "0 20px" }}>
                    <h3 style={{ borderBottom: "2px solid #000", paddingBottom: "5px", marginBottom: "15px" }}>Physics (26-50)</h3>
                    {Array.from({ length: 25 }).map((_, i) => {
                      const qNum = i + 26;
                      return (
                        <div key={qNum} style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                          <span style={{ width: "30px", fontWeight: "bold", textAlign: "right", marginRight: "10px" }}>{qNum}.</span>
                          {["A", "B", "C", "D"].map(opt => (
                            <div key={opt} style={{ width: "24px", height: "24px", borderRadius: "50%", border: "2px solid #000", display: "flex", alignItems: "center", justifyContent: "center", marginRight: "8px", fontSize: "12px" }}>
                              {opt}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>

                  {/* Column 3: Chemistry (51-75) */}
                  <div style={{ flex: 1, padding: "0 20px" }}>
                    <h3 style={{ borderBottom: "2px solid #000", paddingBottom: "5px", marginBottom: "15px" }}>Chemistry (51-75)</h3>
                    {Array.from({ length: 25 }).map((_, i) => {
                      const qNum = i + 51;
                      return (
                        <div key={qNum} style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                          <span style={{ width: "30px", fontWeight: "bold", textAlign: "right", marginRight: "10px" }}>{qNum}.</span>
                          {["A", "B", "C", "D"].map(opt => (
                            <div key={opt} style={{ width: "24px", height: "24px", borderRadius: "50%", border: "2px solid #000", display: "flex", alignItems: "center", justifyContent: "center", marginRight: "8px", fontSize: "12px" }}>
                              {opt}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Left Fiducial */}
              <div style={{ position: "absolute", bottom: 20, left: 20, width: 30, height: 30, backgroundColor: "black" }} />
              {/* Bottom Right Fiducial */}
              <div style={{ position: "absolute", bottom: 20, right: 20, width: 30, height: 30, backgroundColor: "black" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
