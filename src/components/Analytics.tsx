import { useState, useEffect } from 'react';
import { supabase, Ticket } from '../lib/supabase';
import { TrendingUp, AlertTriangle, Clock, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { shouldFilterByDepartment } from '../constants/departments';

export function Analytics() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    if (!profile?.department) return;

    let isMounted = true;

    const fetchTickets = async () => {
      setLoading(true);
      let query = supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (shouldFilterByDepartment(profile.department)) {
        query = query.eq('department', profile.department);
      }

      const { data, error } = await query;

      if (!isMounted) return;

      if (error) {
        console.error('Error fetching tickets:', error);
        setTickets([]);
      } else {
        setTickets(data || []);
      }

      setLoading(false);
    };

    fetchTickets();

    return () => {
      isMounted = false;
    };
  }, [profile?.department]);

  const calculateMetrics = () => {
    const resolvedTickets = tickets.filter(
      (t) => t.status === 'Resolved' || t.status === 'Closed'
    );

    const avgResponseTime = resolvedTickets.length > 0
      ? resolvedTickets.reduce((acc, ticket) => {
          if (ticket.resolved_at) {
            const created = new Date(ticket.created_at).getTime();
            const resolved = new Date(ticket.resolved_at).getTime();
            return acc + (resolved - created) / (1000 * 60 * 60);
          }
          return acc;
        }, 0) / resolvedTickets.length
      : 0;

    const slaBreached = tickets.filter((t) => {
      if (t.status === 'Resolved' || t.status === 'Closed') return false;
      return new Date(t.sla_deadline) < new Date();
    }).length;

    const slaBreachRate = tickets.length > 0 ? (slaBreached / tickets.length) * 100 : 0;

    const categoryBreakdown = tickets.reduce((acc, ticket) => {
      acc[ticket.category] = (acc[ticket.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const departmentLoad = tickets.reduce((acc, ticket) => {
      if (ticket.status !== 'Resolved' && ticket.status !== 'Closed') {
        acc[ticket.department] = (acc[ticket.department] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      avgResponseTime: avgResponseTime.toFixed(1),
      slaBreachRate: slaBreachRate.toFixed(1),
      categoryBreakdown,
      departmentLoad,
      totalTickets: tickets.length,
      openTickets: tickets.filter((t) => t.status === 'Open').length,
      inProgressTickets: tickets.filter((t) => t.status === 'In Progress').length,
      resolvedTickets: resolvedTickets.length,
    };
  };

  if (loading) {
    return (
      <div className="card p-8 text-center text-secondary">
        <div className="animate-pulse space-y-4">
          <div className="mx-auto h-4 w-3/4 rounded bg-white/10"></div>
          <div className="mx-auto h-4 w-1/2 rounded bg-white/10"></div>
        </div>
      </div>
    );
  }

  const metrics = calculateMetrics();

  return (
    <div className="space-y-8 text-primary">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="card bg-gradient-to-br from-accent/20 via-accent/10 to-transparent p-6 text-primary">
          <div className="mb-4 flex items-center justify-between text-secondary">
            <Clock className="h-8 w-8 text-accent" />
            <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-semibold uppercase tracking-wide">
              Hours
            </span>
          </div>
          <h3 className="text-3xl font-semibold text-primary">{metrics.avgResponseTime}</h3>
          <p className="text-sm text-secondary">Avg Response Time</p>
        </div>

        <div className="card bg-gradient-to-br from-danger/25 via-danger/10 to-transparent p-6 text-primary">
          <div className="mb-4 flex items-center justify-between text-secondary">
            <AlertTriangle className="h-8 w-8 text-danger" />
            <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-semibold uppercase tracking-wide">
              Rate
            </span>
          </div>
          <h3 className="text-3xl font-semibold text-primary">{metrics.slaBreachRate}%</h3>
          <p className="text-sm text-secondary">SLA Breach Rate</p>
        </div>

        <div className="card bg-gradient-to-br from-accent-teal/20 via-accent-teal/10 to-transparent p-6 text-primary">
          <div className="mb-4 flex items-center justify-between text-secondary">
            <TrendingUp className="h-8 w-8 text-accent-teal" />
            <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-semibold uppercase tracking-wide">
              Total
            </span>
          </div>
          <h3 className="text-3xl font-semibold text-primary">{metrics.totalTickets}</h3>
          <p className="text-sm text-secondary">Total Tickets</p>
        </div>

        <div className="card bg-gradient-to-br from-accent-strong/20 via-accent-strong/10 to-transparent p-6 text-primary">
          <div className="mb-4 flex items-center justify-between text-secondary">
            <Users className="h-8 w-8 text-accent-strong" />
            <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-semibold uppercase tracking-wide">
              Active
            </span>
          </div>
          <h3 className="text-3xl font-semibold text-primary">
            {metrics.openTickets + metrics.inProgressTickets}
          </h3>
          <p className="text-sm text-secondary">Active Tickets</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="mb-6 text-lg font-semibold text-primary">Tickets by Category</h3>
          <div className="space-y-4">
            {Object.entries(metrics.categoryBreakdown).map(([category, count]) => {
              const percentage = (count / metrics.totalTickets) * 100;
              return (
                <div key={category}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-medium text-secondary">{category}</span>
                    <span className="text-secondary">{count} tickets</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-accent to-accent-strong transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="mb-6 text-lg font-semibold text-primary">Department Load (Active Tickets)</h3>
          <div className="space-y-4">
            {Object.entries(metrics.departmentLoad).length > 0 ? (
              Object.entries(metrics.departmentLoad).map(([department, count]) => {
                const maxLoad = Math.max(...Object.values(metrics.departmentLoad));
                const percentage = (count / maxLoad) * 100;
                return (
                  <div key={department}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-medium text-secondary">{department}</span>
                      <span className="text-secondary">{count} active</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-accent-strong to-accent"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="py-8 text-center text-secondary">No active tickets</p>
            )}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="mb-6 text-lg font-semibold text-primary">Ticket Status Distribution</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="card-elevated flex flex-col items-center gap-1 p-4 text-center">
            <p className="text-3xl font-semibold text-accent">{metrics.openTickets}</p>
            <p className="text-sm text-secondary">Open</p>
          </div>
          <div className="card-elevated flex flex-col items-center gap-1 p-4 text-center">
            <p className="text-3xl font-semibold text-warning">{metrics.inProgressTickets}</p>
            <p className="text-sm text-secondary">In Progress</p>
          </div>
          <div className="card-elevated flex flex-col items-center gap-1 p-4 text-center">
            <p className="text-3xl font-semibold text-success">{metrics.resolvedTickets}</p>
            <p className="text-sm text-secondary">Resolved</p>
          </div>
          <div className="card-elevated flex flex-col items-center gap-1 p-4 text-center">
            <p className="text-3xl font-semibold text-secondary">{metrics.totalTickets}</p>
            <p className="text-sm text-secondary">Total</p>
          </div>
        </div>
      </div>
    </div>
  );
}
