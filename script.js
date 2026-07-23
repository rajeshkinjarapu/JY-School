const fs = require('fs'); 
const path = 'frontend/src/pages/paper-generator/PaperBuilder.tsx'; 
let c = fs.readFileSync(path, 'utf8'); 

c = c.replace(/Link to="\/"/g, 'Link to="/question-bank"'); 
c = c.replace(/max-w-7xl mx-auto px-4/g, 'w-full mx-auto px-2 lg:px-6'); 

const dropdown = `<select
                      value={bankSubject}
                      onChange={(e) => setBankSubject(e.target.value)}
                      className="bg-slate-950/40 border border-slate-800 rounded px-2 py-0.5 text-[10px] text-accentTeal focus:outline-none font-bold"
                    >
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Mathematics">Mathematics</option>
                    </select>`; 

const input = `<input
                      type="text"
                      list="subjectsList"
                      placeholder="e.g. Telugu, Biology"
                      value={bankSubject}
                      onChange={(e) => setBankSubject(e.target.value)}
                      className="bg-slate-50 border border-slate-300 text-slate-800 rounded px-2 py-0.5 text-[11px] focus:outline-none focus:border-accentIndigo font-bold w-32"
                    />
                    <datalist id="subjectsList">
                      <option value="Physics" />
                      <option value="Chemistry" />
                      <option value="Mathematics" />
                      <option value="Biology" />
                      <option value="Telugu" />
                      <option value="English" />
                      <option value="Social" />
                    </datalist>`; 

c = c.replace(dropdown, input); 

c = c.replace(/bg-slate-900\/40/g, 'bg-white shadow-md'); 
c = c.replace(/bg-slate-950\/40/g, 'bg-slate-50'); 
c = c.replace(/bg-slate-950\/30/g, 'bg-slate-50'); 
c = c.replace(/bg-slate-950\/50/g, 'bg-white'); 
c = c.replace(/bg-slate-950\/20/g, 'bg-slate-50'); 
c = c.replace(/bg-slate-900\/60/g, 'bg-slate-50'); 

c = c.replace(/border-slate-850/g, 'border-slate-200'); 
c = c.replace(/border-slate-800/g, 'border-slate-200'); 
c = c.replace(/border-slate-700/g, 'border-slate-300'); 

c = c.replace(/text-slate-200/g, 'text-slate-800'); 
c = c.replace(/text-slate-300/g, 'text-slate-800'); 
c = c.replace(/text-slate-350/g, 'text-slate-700'); 
c = c.replace(/text-slate-400/g, 'text-slate-600'); 
c = c.replace(/text-slate-450/g, 'text-slate-600'); 

c = c.replace(/hover:bg-slate-950\/60/g, 'hover:bg-indigo-50'); 
c = c.replace(/hover:bg-slate-950\/40/g, 'hover:bg-indigo-50 hover:text-indigo-600'); 
c = c.replace(/hover:bg-slate-800/g, 'hover:bg-slate-200'); 

c = c.replace(/text-white mt-1 border-b/g, 'text-slate-800 mt-1 border-b'); 
c = c.replace(/text-\[11px\] text-white/g, 'text-[11px] text-slate-800'); 

fs.writeFileSync(path, c);
