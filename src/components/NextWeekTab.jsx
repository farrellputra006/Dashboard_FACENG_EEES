import React, { useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Circle,
  FileCode,
  PackageCheck,
  HardHat,
  AlertCircle,
  Clock,
  Calendar,
  User,
  Plus,
  ShieldCheck,
  FileCheck2,
  Truck
} from 'lucide-react';
import { nextWeekPlan } from '../data/dashboardData';

export default function NextWeekTab({ dbActivities, selectedWeek }) {
  // Local state for checking off planned items
  const [completedTaskIds, setCompletedTaskIds] = useState(new Set());
  const [filterDepartment, setFilterDepartment] = useState('ALL');

  // Process activities from MySQL
  let groups = nextWeekPlan.groups;

  if (dbActivities && dbActivities.length > 0) {
    const plans = dbActivities.filter(a => a.activity_type === 'next_week_plan');
    if (plans.length > 0) {
      const map = {};
      plans.forEach((p, idx) => {
        const disc = p.discipline || 'General';
        if (!map[disc]) {
          let iconName = 'PackageCheck';
          if (disc.includes('Engineering') || disc.includes('QC')) iconName = 'FileCode';
          else if (disc.includes('Construction')) iconName = 'HardHat';
          else if (disc.includes('HSE')) iconName = 'ShieldCheck';
          map[disc] = {
            title: disc,
            department: disc.toUpperCase(),
            icon: iconName,
            color: 'bg-blue-500/10 text-blue-600 border-blue-200',
            tasks: []
          };
        }
        map[disc].tasks.push({
          id: `task-db-${idx}`,
          title: p.description,
          targetDate: 'Next Period Cutoff',
          assignedTo: 'PIC ' + disc,
          priority: idx % 3 === 0 ? 'High' : idx % 3 === 1 ? 'Urgent' : 'Medium',
          dependencies: 'Approved Inspection Schedule'
        });
      });
      groups = Object.values(map);
    }
  }

  const toggleTask = (taskId) => {
    setCompletedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const getDepartmentIcon = (iconName) => {
    switch (iconName) {
      case 'FileCode':
        return <FileCode className="w-5 h-5 text-blue-600" />;
      case 'PackageCheck':
        return <PackageCheck className="w-5 h-5 text-emerald-600" />;
      case 'HardHat':
        return <HardHat className="w-5 h-5 text-amber-600" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5 text-emerald-600" />;
      default:
        return <CalendarClock className="w-5 h-5 text-indigo-600" />;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'High':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Medium':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const filteredGroups = groups.filter((grp) => {
    if (filterDepartment === 'ALL') return true;
    return grp.title.toUpperCase().includes(filterDepartment);
  });

  // Calculate next week label (e.g. Week 12 -> Next: Week 13)
  let nextWeekNum = 'W+1';
  if (selectedWeek) {
    const match = selectedWeek.match(/\d+/);
    if (match) nextWeekNum = `Week ${parseInt(match[0]) + 1}`;
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header with KPI and Filtering */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Lookahead Work Plan ({nextWeekNum})</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Lookahead Action Items
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Forward schedule based on current progress milestone from {selectedWeek || 'Current Week'}
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl shadow-xs text-xs">
          {['ALL', 'ENGINEERING', 'PROCUREMENT', 'CONSTRUCTION'].map((dept) => (
            <button
              key={dept}
              type="button"
              onClick={() => setFilterDepartment(dept)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterDepartment === dept
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Planned Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {filteredGroups.map((group) => (
          <div
            key={group.title}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div>
              {/* Group Header */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    {getDepartmentIcon(group.icon)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{group.title}</h4>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {group.tasks.length} Action Items
                    </span>
                  </div>
                </div>
              </div>

              {/* Task Checklist */}
              <div className="space-y-3">
                {group.tasks.map((task) => {
                  const isDone = completedTaskIds.has(task.id);

                  return (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                        isDone
                          ? 'bg-emerald-50/40 border-emerald-200 opacity-75'
                          : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          className="mt-0.5 text-slate-400 hover:text-blue-600 shrink-0"
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold leading-snug transition-colors ${
                            isDone ? 'line-through text-slate-400' : 'text-slate-800'
                          }`}>
                            {task.title}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px]">
                            <span className={`px-2 py-0.5 rounded-full font-bold border ${getPriorityBadge(task.priority)}`}>
                              {task.priority}
                            </span>
                            <span className="flex items-center gap-1 text-slate-500 font-mono">
                              <Calendar className="w-3 h-3" />
                              {task.targetDate}
                            </span>
                            <span className="text-slate-400 font-medium">
                              PIC: {task.assignedTo}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Verified Lookahead</span>
              <span className="font-mono text-slate-600">Period: {nextWeekNum}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
