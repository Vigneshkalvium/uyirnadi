"use client";

import { Search, ShieldAlert, Tablets } from "lucide-react";
import { useMemo, useState } from "react";

type Tablet = { name: string; ingredient: string; helpsWith: string; category: string; note: string };

const tablets: Tablet[] = [
  { name: "Paracetamol", ingredient: "Acetaminophen", helpsWith: "Fever and mild pain", category: "Pain & fever", note: "Check combination cold medicines to avoid taking it twice." },
  { name: "Ibuprofen", ingredient: "Ibuprofen", helpsWith: "Pain, inflammation and fever", category: "Pain & fever", note: "May not suit people with ulcers, kidney disease or some heart conditions." },
  { name: "Naproxen", ingredient: "Naproxen", helpsWith: "Inflammatory pain", category: "Pain & fever", note: "Can irritate the stomach; ask a pharmacist if you have kidney or heart disease." },
  { name: "Aspirin", ingredient: "Acetylsalicylic acid", helpsWith: "Pain and fever", category: "Pain & fever", note: "Not for children or teenagers with viral illness unless a clinician says so." },
  { name: "Cetirizine", ingredient: "Cetirizine", helpsWith: "Allergy symptoms such as sneezing or itching", category: "Allergy", note: "Can make some people drowsy." },
  { name: "Levocetirizine", ingredient: "Levocetirizine", helpsWith: "Allergy symptoms", category: "Allergy", note: "May cause sleepiness; avoid alcohol if it affects you." },
  { name: "Loratadine", ingredient: "Loratadine", helpsWith: "Seasonal allergy symptoms", category: "Allergy", note: "Ask before use with liver problems or other medicines." },
  { name: "Fexofenadine", ingredient: "Fexofenadine", helpsWith: "Hay fever and hives", category: "Allergy", note: "Fruit juices can affect how it is absorbed." },
  { name: "Omeprazole", ingredient: "Omeprazole", helpsWith: "Acid reflux and heartburn", category: "Digestive", note: "Persistent heartburn needs medical review." },
  { name: "Pantoprazole", ingredient: "Pantoprazole", helpsWith: "Acid reflux and stomach acid conditions", category: "Digestive", note: "Use only as advised, especially for long periods." },
  { name: "Famotidine", ingredient: "Famotidine", helpsWith: "Heartburn and indigestion", category: "Digestive", note: "Seek care for black stools, vomiting blood, or chest pain." },
  { name: "Antacid", ingredient: "Aluminium/magnesium salts", helpsWith: "Occasional acidity", category: "Digestive", note: "Separate from other medicines as it can affect absorption." },
  { name: "Loperamide", ingredient: "Loperamide", helpsWith: "Short-term diarrhoea", category: "Digestive", note: "Do not use with bloody diarrhoea, fever, or suspected infection without advice." },
  { name: "Oral rehydration salts", ingredient: "Glucose and electrolytes", helpsWith: "Replacing fluids during diarrhoea", category: "Digestive", note: "Use the packet directions; urgent care is needed for dehydration signs." },
  { name: "Ondansetron", ingredient: "Ondansetron", helpsWith: "Nausea and vomiting", category: "Digestive", note: "Usually needs clinician advice; mention heart rhythm problems." },
  { name: "Metformin", ingredient: "Metformin", helpsWith: "Type 2 diabetes glucose control", category: "Diabetes", note: "Prescription medicine—do not start, stop, or change it without your clinician." },
  { name: "Glimepiride", ingredient: "Glimepiride", helpsWith: "Type 2 diabetes glucose control", category: "Diabetes", note: "Can cause low blood sugar; use only as prescribed." },
  { name: "Sitagliptin", ingredient: "Sitagliptin", helpsWith: "Type 2 diabetes glucose control", category: "Diabetes", note: "Prescription medicine; discuss kidney problems with your clinician." },
  { name: "Amlodipine", ingredient: "Amlodipine", helpsWith: "High blood pressure", category: "Heart & blood pressure", note: "Prescription medicine; swelling in the ankles can occur." },
  { name: "Losartan", ingredient: "Losartan", helpsWith: "High blood pressure", category: "Heart & blood pressure", note: "Prescription medicine; monitoring may be needed." },
  { name: "Telmisartan", ingredient: "Telmisartan", helpsWith: "High blood pressure", category: "Heart & blood pressure", note: "Do not use in pregnancy; take only as prescribed." },
  { name: "Atorvastatin", ingredient: "Atorvastatin", helpsWith: "Lowering cholesterol", category: "Heart & blood pressure", note: "Report unexplained muscle pain to a clinician." },
  { name: "Rosuvastatin", ingredient: "Rosuvastatin", helpsWith: "Lowering cholesterol", category: "Heart & blood pressure", note: "Prescription medicine; discuss muscle symptoms or liver disease." },
  { name: "Clopidogrel", ingredient: "Clopidogrel", helpsWith: "Preventing blood clots in selected patients", category: "Heart & blood pressure", note: "Do not stop without the prescriber’s direction; bleeding risk matters." },
  { name: "Salbutamol tablets", ingredient: "Salbutamol", helpsWith: "Selected breathing conditions", category: "Breathing", note: "Inhalers are often preferred; use only when prescribed." },
  { name: "Montelukast", ingredient: "Montelukast", helpsWith: "Asthma or allergy control", category: "Breathing", note: "Not for sudden asthma attacks; report mood or behaviour changes." },
  { name: "Prednisolone", ingredient: "Prednisolone", helpsWith: "Inflammation in selected conditions", category: "Breathing", note: "Prescription steroid; do not stop suddenly unless instructed." },
  { name: "Amoxicillin", ingredient: "Amoxicillin", helpsWith: "Some bacterial infections", category: "Antibiotic", note: "Does not treat colds or flu; use only when prescribed." },
  { name: "Azithromycin", ingredient: "Azithromycin", helpsWith: "Some bacterial infections", category: "Antibiotic", note: "Prescription antibiotic; complete exactly as directed by your clinician." },
  { name: "Doxycycline", ingredient: "Doxycycline", helpsWith: "Some bacterial infections", category: "Antibiotic", note: "Prescription medicine; can make skin more sun-sensitive." },
  { name: "Fluconazole", ingredient: "Fluconazole", helpsWith: "Some fungal infections", category: "Antifungal", note: "Has important interactions; ask a pharmacist before combining medicines." },
  { name: "Acyclovir", ingredient: "Acyclovir", helpsWith: "Some herpes virus infections", category: "Antiviral", note: "Prescription medicine; seek advice for eye symptoms or severe illness." },
  { name: "Ferrous sulfate", ingredient: "Iron", helpsWith: "Iron deficiency when confirmed", category: "Vitamins & minerals", note: "Can cause constipation and dark stools; keep away from children." },
  { name: "Folic acid", ingredient: "Folate", helpsWith: "Folate deficiency and pregnancy supplementation", category: "Vitamins & minerals", note: "Use the product and amount recommended by your clinician." },
  { name: "Calcium carbonate", ingredient: "Calcium", helpsWith: "Calcium supplementation", category: "Vitamins & minerals", note: "May interact with some medicines; do not exceed the label." },
  { name: "Vitamin D3", ingredient: "Cholecalciferol", helpsWith: "Vitamin D supplementation", category: "Vitamins & minerals", note: "Too much can be harmful; use a clinician’s advice for deficiency treatment." },
  { name: "Levothyroxine", ingredient: "Levothyroxine", helpsWith: "Underactive thyroid", category: "Hormones", note: "Prescription medicine; timing and monitoring are important." },
  { name: "Medroxyprogesterone", ingredient: "Medroxyprogesterone", helpsWith: "Selected menstrual conditions", category: "Hormones", note: "Prescription hormone; not suitable for everyone." },
  { name: "Sertraline", ingredient: "Sertraline", helpsWith: "Depression or anxiety in selected patients", category: "Mental health", note: "Prescription medicine; do not stop suddenly without clinical advice." },
  { name: "Escitalopram", ingredient: "Escitalopram", helpsWith: "Depression or anxiety in selected patients", category: "Mental health", note: "Prescription medicine; contact a clinician for worsening mood or self-harm thoughts." },
  { name: "Alprazolam", ingredient: "Alprazolam", helpsWith: "Short-term anxiety in selected patients", category: "Mental health", note: "Can be habit-forming and sedating; prescription use only." },
  { name: "Zolpidem", ingredient: "Zolpidem", helpsWith: "Short-term insomnia in selected patients", category: "Mental health", note: "Can impair alertness; take only as prescribed." },
  { name: "Allopurinol", ingredient: "Allopurinol", helpsWith: "Long-term gout prevention", category: "Muscle & joint", note: "Prescription medicine; seek urgent advice for a rash." },
  { name: "Colchicine", ingredient: "Colchicine", helpsWith: "Gout attacks in selected patients", category: "Muscle & joint", note: "Has a narrow safety margin—never exceed prescribed directions." },
  { name: "Diclofenac", ingredient: "Diclofenac", helpsWith: "Pain and inflammation", category: "Muscle & joint", note: "May raise stomach, kidney, and heart risks; use only as advised." },
  { name: "Cyclobenzaprine", ingredient: "Cyclobenzaprine", helpsWith: "Muscle spasm in selected patients", category: "Muscle & joint", note: "Can cause drowsiness and has interactions; prescription use only." },
  { name: "Tamsulosin", ingredient: "Tamsulosin", helpsWith: "Urinary symptoms from enlarged prostate", category: "Urinary", note: "May cause dizziness when standing; prescription medicine." },
  { name: "Oxybutynin", ingredient: "Oxybutynin", helpsWith: "Overactive bladder symptoms", category: "Urinary", note: "Can cause dry mouth and constipation; prescription use only." },
  { name: "Sildenafil", ingredient: "Sildenafil", helpsWith: "Erectile dysfunction in selected patients", category: "Sexual health", note: "Never combine with nitrate heart medicines; prescription advice is essential." },
  { name: "Mebendazole", ingredient: "Mebendazole", helpsWith: "Some intestinal worm infections", category: "Antiparasitic", note: "Ask a pharmacist about pregnancy, age, and the right treatment." },
];

export function TabletGuide() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const categories = ["All", ...new Set(tablets.map((tablet) => tablet.category))];
  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    return tablets.filter((tablet) => (category === "All" || tablet.category === category) && (!term || Object.values(tablet).some((value) => value.toLowerCase().includes(term))));
  }, [query, category]);

  return <section>
    <div className="page-header"><div><p className="eyebrow">MEDICINE REFERENCE</p><h1 className="mt-2">Tablet information guide</h1><p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">Browse a basic, hardcoded reference for 50 common tablets. It explains general uses—not a diagnosis, prescription, or dose recommendation.</p></div><div className="hidden rounded-xl bg-[#edf4e8] p-3 text-primary sm:block"><Tablets className="size-6" /></div></div>
    <div className="card mb-5 border-[#eadcae] bg-[#fffdf5] p-4"><div className="flex gap-3"><ShieldAlert className="mt-0.5 size-5 shrink-0 text-[#9a7c36]" /><p className="text-xs leading-relaxed text-[#74613c]"><strong>Safety first:</strong> Do not use this list to start, stop, share, or change any medicine. Check the package and ask a pharmacist or clinician about the right medicine, dose, interactions, pregnancy, allergies, and existing conditions. Seek urgent help for severe reactions, trouble breathing, chest pain, or suspected overdose.</p></div></div>
    <div className="card overflow-hidden"><div className="border-b border-border p-4 sm:flex sm:items-center sm:gap-3"><div className="relative flex-1"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><input className="input pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tablet, ingredient, use, or category…" aria-label="Search tablet guide" /></div><select className="input mt-3 sm:mt-0 sm:w-52" value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category">{categories.map((item) => <option key={item}>{item}</option>)}</select></div><div className="flex items-center justify-between px-5 py-3 text-xs text-muted-foreground"><span>{results.length} of {tablets.length} tablets shown</span><span>General information only</span></div><div className="table-wrap"><table className="data-table min-w-[820px]"><thead><tr><th>Tablet</th><th>Active ingredient</th><th>Generally used for</th><th>Category</th><th>Important note</th></tr></thead><tbody>{results.map((tablet) => <tr key={tablet.name}><td className="font-semibold text-foreground">{tablet.name}</td><td>{tablet.ingredient}</td><td>{tablet.helpsWith}</td><td><span className="badge badge-green">{tablet.category}</span></td><td className="max-w-xs leading-relaxed text-muted-foreground">{tablet.note}</td></tr>)}</tbody></table>{results.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">No tablets match that search. Try a different name, symptom, or category.</div>}</div></div>
  </section>;
}
