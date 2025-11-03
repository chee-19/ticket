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
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  const metrics = calculateMetrics();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 opacity-80" />
            <span className="text-xs font-semibold bg-white bg-opacity-20 px-2 py-1 rounded">
              HOURS
            </span>
          </div>
          <h3 className="text-3xl font-bold mb-1">{metrics.avgResponseTime}</h3>
          <p className="text-blue-100 text-sm">Avg Response Time</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="w-8 h-8 opacity-80" />
            <span className="text-xs font-semibold bg-white bg-opacity-20 px-2 py-1 rounded">
              RATE
            </span>
          </div>
          <h3 className="text-3xl font-bold mb-1">{metrics.slaBreachRate}%</h3>
          <p className="text-red-100 text-sm">SLA Breach Rate</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 opacity-80" />
            <span className="text-xs font-semibold bg-white bg-opacity-20 px-2 py-1 rounded">
              TOTAL
            </span>
          </div>
          <h3 className="text-3xl font-bold mb-1">{metrics.totalTickets}</h3>
          <p className="text-green-100 text-sm">Total Tickets</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 opacity-80" />
            <span className="text-xs font-semibold bg-white bg-opacity-20 px-2 py-1 rounded">
              ACTIVE
            </span>
          </div>
          <h3 className="text-3xl font-bold mb-1">{metrics.openTickets + metrics.inProgressTickets}</h3>
          <p className="text-amber-100 text-sm">Active Tickets</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Tickets by Category</h3>
          <div className="space-y-4">
            {Object.entries(metrics.categoryBreakdown).map(([category, count]) => {
              const percentage = (count / metrics.totalTickets) * 100;
              return (
                <div key={category}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-700 font-medium">{category}</span>
                    <span className="text-gray-600">{count} tickets</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Department Load (Active Tickets)</h3>
          <div className="space-y-4">
            {Object.entries(metrics.departmentLoad).length > 0 ? (
              Object.entries(metrics.departmentLoad).map(([department, count]) => {
                const maxLoad = Math.max(...Object.values(metrics.departmentLoad));
                const percentage = (count / maxLoad) * 100;
                return (
                  <div key={department}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700 font-medium">{department}</span>
                      <span className="text-gray-600">{count} active</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-amber-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-center py-8">No active tickets</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Ticket Status Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-blue-600 mb-1">{metrics.openTickets}</p>
            <p className="text-sm text-gray-600">Open</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-yellow-600 mb-1">{metrics.inProgressTickets}</p>
            <p className="text-sm text-gray-600">In Progress</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-green-600 mb-1">{metrics.resolvedTickets}</p>
            <p className="text-sm text-gray-600">Resolved</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-gray-600 mb-1">{metrics.totalTickets}</p>
            <p className="text-sm text-gray-600">Total</p>
          </div>
        </div>
      </div>
    </div>
  );
}
