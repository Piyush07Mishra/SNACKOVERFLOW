'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Briefcase, MapPin, IndianRupee } from "lucide-react";

interface Employee {
  _id: string;
  name: string;
  email: string;
  role: string;
  designation: string;
  department: string;
  status: 'present' | 'leave' | 'absent';
  payroll: {
    netSalary: number;
    status: string;
  } | null;
}

export function EmployeeGrid() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      if (Array.isArray(data)) {
        setEmployees(data);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    // Real-time updates: fetch every 10 seconds
    const interval = setInterval(fetchEmployees, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading workforce data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Active Workforce</h2>
        <div className="flex gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>Present</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span>Leave</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-yellow-500" />
            <span>Absent</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {employees.map((employee) => (
          <Card key={employee._id} className="group relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border-border/50 bg-card/50 backdrop-blur-xl">
            {/* Status Indicator */}
            <div className="absolute top-4 right-4 z-10">
              <div className="relative">
                <div className={`h-3 w-3 rounded-full ${employee.status === 'present' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' :
                    employee.status === 'leave' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' :
                      'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]'
                  }`} />
                <div className={`absolute inset-0 h-3 w-3 rounded-full animate-ping opacity-20 ${employee.status === 'present' ? 'bg-green-500' :
                    employee.status === 'leave' ? 'bg-blue-500' :
                      'bg-yellow-500'
                  }`} />
              </div>
            </div>

            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full ring-4 ring-background shadow-2xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
                    <img
                      src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${employee.name}&backgroundColor=b6e3f4,c0aede,d1d4f9`}
                      alt={employee.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-1 w-full">
                  <h3 className="font-bold text-lg line-clamp-1">{employee.name}</h3>
                  <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                    <Briefcase className="h-3.5 w-3.5" />
                    <p className="text-xs font-medium line-clamp-1">{employee.designation || 'Staff Member'}</p>
                  </div>
                  <Badge variant="secondary" className="mt-2 text-[10px] h-5 px-2 bg-primary/5 text-primary border-primary/10">
                    {employee.role.replace('_', ' ')}
                  </Badge>
                </div>

                {/* Footer Details */}
                <div className="w-full grid grid-cols-2 gap-2 pt-4 border-t border-border/50">
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Dept.</span>
                    <div className="flex items-center gap-1 text-xs font-semibold">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="line-clamp-1">{employee.department || 'General'}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Base Salary</span>
                    <div className="flex items-center gap-1 text-xs font-bold text-primary">
                      <IndianRupee className="h-3 w-3" />
                      <span>{employee.payroll?.netSalary?.toLocaleString() || '0'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
