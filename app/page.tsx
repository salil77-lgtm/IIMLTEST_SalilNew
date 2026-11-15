"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, CircleDashed, Clock3, ListTodo, Plus, Search, Trash2, X } from "lucide-react";

type Status = "Not started" | "In progress" | "Completed";
type Priority = "Low" | "Medium" | "High";
type Task = {
  id: string;
  title: string;
  description: string;
  startDate: string;
  dueDate: string;
  priority: Priority;
  status: Status;
  progress: number;
  createdAt: string;
};

const STORAGE_KEY = "momentum-tasks-v1";
const emptyForm = { title: "", description: "", startDate: "", dueDate: "", priority: "Medium" as Priority };

function localDate(value: string) {
  if (!value) return "No date";
  return new Date(value + "T00:00:00").toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}
function dayDiff(value: string) {
  const today = new Date(); today.setHours(0,0,0,0);
  return Math.ceil((new Date(value + "T00:00:00").getTime() - today.getTime()) / 86400000);
}
function timelineText(task: Task) {
  if (task.status === "Completed") return "Completed";
  const days = dayDiff(task.dueDate);
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
  if (days === 0) return "Due today";
  if (days <= 7) return `Due in ${days} day${days === 1 ? "" : "s"}`;
  return `Due ${localDate(task.dueDate)}`;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ready, setReady] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [statusFilter, setStatusFilter] = useState<"All" | Status>("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    try { const saved = localStorage.getItem(STORAGE_KEY); if (saved) setTasks(JSON.parse(saved)); } catch {}
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }, [tasks, ready]);

  const metrics = useMemo(() => ({
    total: tasks.length,
    active: tasks.filter(t => t.status !== "Completed").length,
    completed: tasks.filter(t => t.status === "Completed").length,
    overdue: tasks.filter(t => t.status !== "Completed" && dayDiff(t.dueDate) < 0).length,
  }), [tasks]);
  const overallProgress = tasks.length ? Math.round(tasks.reduce((a,t) => a + t.progress, 0) / tasks.length) : 0;
  const filtered = useMemo(() => tasks.filter(t =>
    (statusFilter === "All" || t.status === statusFilter) &&
    (t.title + " " + t.description).toLowerCase().includes(search.toLowerCase())
  ).sort((a,b) => a.dueDate.localeCompare(b.dueDate)), [tasks, statusFilter, search]);

  function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.startDate || !form.dueDate) return;
    if (form.dueDate < form.startDate) { alert("Due date must be on or after the start date."); return; }
    setTasks([{ id: crypto.randomUUID(), ...form, title: form.title.trim(), description: form.description.trim(), status: "Not started", progress: 0, createdAt: new Date().toISOString() }, ...tasks]);
    setForm(emptyForm); setShowForm(false);
  }
  function updateTask(id: string, patch: Partial<Task>) {
    setTasks(tasks.map(t => {
      if (t.id !== id) return t;
      const next = { ...t, ...patch };
      if (patch.status === "Completed") next.progress = 100;
      if (patch.progress !== undefined) next.status = patch.progress === 100 ? "Completed" : patch.progress > 0 ? "In progress" : "Not started";
      return next;
    }));
  }
  function removeTask(id: string) { if (confirm("Delete this task?")) setTasks(tasks.filter(t => t.id !== id)); }

  return <main>
    <header className="topbar"><div className="brand"><span className="brandIcon"><CheckCircle2 size={22}/></span><span>Momentum</span></div><button className="primary" onClick={() => setShowForm(true)}><Plus size={18}/> Add task</button></header>
    <section className="shell">
      <div className="hero"><div><p className="eyebrow">TASK MANAGER</p><h1>Keep work moving.</h1><p>Plan your tasks, manage timelines and track progress in one clear view.</p></div><div className="overall"><div className="ring" style={{"--p": `${overallProgress * 3.6}deg`} as React.CSSProperties}><span>{overallProgress}%</span></div><div><b>Overall progress</b><small>{metrics.completed} of {metrics.total} tasks complete</small></div></div></div>
      <div className="metrics">
        <Metric icon={<ListTodo/>} label="Total tasks" value={metrics.total} tone="blue" />
        <Metric icon={<CircleDashed/>} label="Active" value={metrics.active} tone="purple" />
        <Metric icon={<CheckCircle2/>} label="Completed" value={metrics.completed} tone="green" />
        <Metric icon={<Clock3/>} label="Overdue" value={metrics.overdue} tone="red" />
      </div>
      {metrics.overdue > 0 && <div className="notice"><Clock3 size={18}/><span><b>Attention needed:</b> {metrics.overdue} task{metrics.overdue === 1 ? " is" : "s are"} overdue.</span></div>}
      <div className="toolbar"><div className="search"><Search size={18}/><input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)}/></div><div className="tabs">{(["All","Not started","In progress","Completed"] as const).map(s => <button key={s} className={statusFilter===s ? "active" : ""} onClick={() => setStatusFilter(s)}>{s}</button>)}</div></div>
      <div className="taskList">
        {!ready ? <div className="empty">Loading tasks...</div> : filtered.length === 0 ? <div className="empty"><CheckCircle2 size={42}/><h3>No tasks here</h3><p>Add a task or change your filters.</p><button className="primary" onClick={() => setShowForm(true)}><Plus size={18}/> Add your first task</button></div> : filtered.map(task => <TaskCard key={task.id} task={task} update={updateTask} remove={removeTask}/>) }
      </div>
    </section>
    {showForm && <div className="modalBackdrop" onMouseDown={() => setShowForm(false)}><div className="modal" onMouseDown={e => e.stopPropagation()}><div className="modalHead"><div><p className="eyebrow">NEW TASK</p><h2>What needs to be done?</h2></div><button className="iconButton" onClick={() => setShowForm(false)}><X size={20}/></button></div><form onSubmit={addTask}>
      <label>Task name<input autoFocus required placeholder="e.g. Prepare SteerCo update" value={form.title} onChange={e => setForm({...form,title:e.target.value})}/></label>
      <label>Description<textarea placeholder="Add context, outcome or next steps" rows={3} value={form.description} onChange={e => setForm({...form,description:e.target.value})}/></label>
      <div className="formGrid"><label>Start date<input required type="date" value={form.startDate} onChange={e => setForm({...form,startDate:e.target.value})}/></label><label>Due date<input required type="date" value={form.dueDate} onChange={e => setForm({...form,dueDate:e.target.value})}/></label></div>
      <label>Priority<select value={form.priority} onChange={e => setForm({...form,priority:e.target.value as Priority})}><option>Low</option><option>Medium</option><option>High</option></select></label>
      <div className="formActions"><button type="button" className="secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="primary" type="submit"><Plus size={18}/> Create task</button></div>
    </form></div></div>}
  </main>;
}

function Metric({icon,label,value,tone}:{icon:React.ReactNode,label:string,value:number,tone:string}) { return <div className="metric"><span className={`metricIcon ${tone}`}>{icon}</span><div><b>{value}</b><small>{label}</small></div></div> }
function TaskCard({task,update,remove}:{task:Task,update:(id:string,p:Partial<Task>)=>void,remove:(id:string)=>void}) {
  const overdue = task.status !== "Completed" && dayDiff(task.dueDate) < 0;
  return <article className={`taskCard ${task.status === "Completed" ? "done" : ""}`}>
    <div className="taskTop"><div className="taskTitle"><button className={`check ${task.status === "Completed" ? "checked" : ""}`} onClick={() => update(task.id,{status:task.status === "Completed" ? "Not started" : "Completed"})}>{task.status === "Completed" && <CheckCircle2 size={22}/>}</button><div><h3>{task.title}</h3>{task.description && <p>{task.description}</p>}</div></div><button className="delete" onClick={() => remove(task.id)} aria-label="Delete task"><Trash2 size={18}/></button></div>
    <div className="taskMeta"><span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span><span><CalendarDays size={15}/>{localDate(task.startDate)} → {localDate(task.dueDate)}</span><span className={overdue ? "late" : ""}><Clock3 size={15}/>{timelineText(task)}</span></div>
    <div className="progressRow"><div className="progressLabel"><span>Progress</span><b>{task.progress}%</b></div><input aria-label="Task progress" type="range" min="0" max="100" step="5" value={task.progress} onChange={e => update(task.id,{progress:Number(e.target.value)})}/></div>
    <div className="statusRow"><label>Status<select value={task.status} onChange={e => update(task.id,{status:e.target.value as Status})}><option>Not started</option><option>In progress</option><option>Completed</option></select></label></div>
  </article>
}
