import { useState } from "react";
import { Card, CardContent } from "../components/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Users, Calendar, CreditCard, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const stats = [
    {
      title: "تعداد مشتریان فعال",
      value: 128,
      icon: <Users className="text-indigo-500" />,
      trend: "+12%",
    },
    {
      title: "جلسات این هفته",
      value: 42,
      icon: <Calendar className="text-sky-500" />,
      trend: "+8%",
    },
    {
      title: "درآمد این ماه",
      value: "14,300,000",
      icon: <CreditCard className="text-emerald-500" />,
      trend: "+5%",
    },
  ];

  const weeklySessions = [
    { day: "ش", value: 8 },
    { day: "ی", value: 6 },
    { day: "د", value: 10 },
    { day: "س", value: 7 },
    { day: "چ", value: 12 },
    { day: "پ", value: 5 },
    { day: "ج", value: 3 },
  ];

  const monthlyIncome = [
    { month: "فروردین", value: 12 },
    { month: "اردیبهشت", value: 18 },
    { month: "خرداد", value: 22 },
    { month: "تیر", value: 25 },
    { month: "مرداد", value: 19 },
    { month: "شهریور", value: 27 },
  ];

  return (
    <div className="p-8 space-y-10">
      {/* Header */}
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold bg-linier-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent"
      >
        داشبورد مدیریتی
      </motion.h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="rounded-2xl shadow-lg border border-slate-100">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm">{item.title}</p>
                  <p className="text-2xl font-bold mt-2">{item.value}</p>
                  <div className="flex items-center gap-1 text-emerald-500 text-xs mt-1">
                    <ArrowUpRight size={14} />
                    {item.trend}
                  </div>
                </div>
                <div className="text-4xl opacity-70">{item.icon}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Sessions Chart */}
        <Card className="rounded-2xl shadow-lg border border-slate-100">
          <CardContent className="p-6">
            <h2 className="font-semibold mb-4">آمار جلسات هفتگی</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklySessions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Income Chart */}
        <Card className="rounded-2xl shadow-lg border border-slate-100">
          <CardContent className="p-6">
            <h2 className="font-semibold mb-4">درآمد ماهانه</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyIncome}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line dataKey="value" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {[
          { title: "افزودن مشتری جدید", color: "from-indigo-500 to-blue-500" },
          { title: "تنظیم جلسه جدید", color: "from-emerald-500 to-teal-500" },
          { title: "ثبت پرداخت", color: "from-amber-500 to-orange-500" },
        ].map((item, idx) => (
          <motion.button
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * idx }}
            className={`p-4 text-white rounded-2xl shadow-lg bg-linier-to-r ${item.color} hover:opacity-90 transition text-center font-medium`}
          >
            {item.title}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
