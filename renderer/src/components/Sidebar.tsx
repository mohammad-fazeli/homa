import { NavLink } from "react-router-dom";

const menuItems = [
  { name: "داشبورد", path: "/", icon: "🏠" },

  {
    name: "مدیریت مشتریان",
    path: "/clients",
    icon: "👥",
    children: [
      { name: "لیست مشتریان", path: "/clients" },
      { name: "افزودن مشتری", path: "/clients/new" },
    ],
  },

  {
    name: "جلسات",
    path: "/sessions",
    icon: "📅",
    children: [
      { name: "تقویم جلسات", path: "/sessions/calendar" },
      { name: "تنظیم جلسه جدید", path: "/sessions/new" },
    ],
  },

  {
    name: "مالی",
    path: "/billing",
    icon: "💰",
    children: [
      { name: "ثبت پرداخت", path: "/billing/new" },
      { name: "تمدید جلسات", path: "/billing/renew" },
      { name: "لیست بدهکاران", path: "/billing/debtors" },
    ],
  },

  {
    name: "گزارش‌ها",
    path: "/reports",
    icon: "📊",
    children: [
      { name: "گزارش جلسات", path: "/reports/sessions" },
      { name: "گزارش مالی", path: "/reports/finance" },
    ],
  },

  { name: "تنظیمات", path: "/settings", icon: "⚙️" },
];

export default function Sidebar() {
  return (
    <div className="w-64 h-full bg-gray-900 text-white p-4 overflow-y-auto">
      <h2 className="text-xl font-bold mb-6 text-center">پنل مدیریت</h2>

      <ul className="space-y-2">
        {menuItems.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `flex items-center p-2 rounded-lg cursor-pointer transition ${
                  isActive ? "bg-gray-700" : "hover:bg-gray-800"
                }`
              }
            >
              <span className="text-lg mr-2">{item.icon}</span>
              <span>{item.name}</span>
            </NavLink>

            {/* زیرمنو */}
            {item.children && (
              <ul className="ml-6 mt-1 space-y-1 text-sm">
                {item.children.map((sub) => (
                  <li key={sub.path}>
                    <NavLink
                      to={sub.path}
                      className={({ isActive }) =>
                        `block p-2 rounded-lg transition ${
                          isActive ? "bg-gray-700" : "hover:bg-gray-800"
                        }`
                      }
                    >
                      {sub.name}
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
