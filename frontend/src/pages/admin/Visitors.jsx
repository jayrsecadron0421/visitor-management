import { useEffect, useState } from "react";
import { 
  Users, UserPlus, Search, Edit2, Trash2, X, 
  Phone, Mail, Building, Calendar, CheckCircle, XCircle 
} from "lucide-react";
import api from "../../api/axios";

export default function AdminVisitors() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState(null);
  const [modalMode, setModalMode] = useState("create"); // 'create' or 'edit'
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchVisitors();
  }, []);

  const fetchVisitors = async () => {
    try {
      const res = await api.get("/visitors");
      setVisitors(res.data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching visitors:", error);
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingVisitor({
      full_name: "",
      email: "",
      phone_number: "",
      company: "",
      reason: "",
      is_active: true,
      visiting_name: "",
    });
    setModalMode("create");
    setIsModalOpen(true);
  };

  const openEditModal = (visitor) => {
    setEditingVisitor({ ...visitor });
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingVisitor(null);
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === "create") {
        await api.post("/visitors", editingVisitor);
      } else {
        await api.put(`/visitors/${editingVisitor.id}`, editingVisitor);
      }
      fetchVisitors();
      closeModal();
    } catch (error) {
      console.error("Error saving visitor:", error);
      alert("Failed to save visitor");
    }
  };

  const deleteVisitor = async (id) => {
    if (!confirm("Are you sure you want to delete this visitor?")) return;
    try {
      await api.delete(`/visitors/${id}`);
      setVisitors(visitors.filter(v => v.id !== id));
    } catch (error) {
      alert("Failed to delete visitor");
    }
  };

  const handleInputChange = (field, value) => {
    setEditingVisitor({ ...editingVisitor, [field]: value });
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Helper for avatars
  const getInitials = (name) => name ? name.charAt(0).toUpperCase() : "?";

  // Calculated Stats
  const stats = {
    total: visitors.length,
    active: visitors.filter((v) => v.is_active).length,
    inactive: visitors.filter((v) => !v.is_active).length,
    recent: visitors.filter((v) => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(v.created_at) > weekAgo;
    }).length,
  };

  const filteredVisitors = visitors.filter((v) => {
    const q = searchQuery.toLowerCase();
    return (
      v.full_name?.toLowerCase().includes(q) ||
      v.email?.toLowerCase().includes(q) ||
      v.phone_number?.includes(q) ||
      v.company?.toLowerCase().includes(q) ||
      v.reason?.toLowerCase().includes(q) ||
      v.visiting_name?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Loading visitors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Visitor Management</h1>
            <p className="text-gray-500 mt-1">Track and manage facility access and guest history.</p>
          </div>
          <button
            onClick={openCreateModal}
            className="group flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-200 transition-all active:scale-95"
          >
            <UserPlus size={18} />
            <span>Register Visitor</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard title="Total Visitors" value={stats.total} icon={<Users size={20} />} color="blue" />
          <StatCard title="Active Now" value={stats.active} icon={<CheckCircle size={20} />} color="green" />
          <StatCard title="Inactive" value={stats.inactive} icon={<XCircle size={20} />} color="gray" />
          <StatCard title="New this Week" value={stats.recent} icon={<Calendar size={20} />} color="purple" />
        </div>

        {/* Main Table Card */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {/* Search Bar */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, company, reason..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-gray-50"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
              >
                <X size={14} /> Clear
              </button>
            )}
            <span className="text-sm text-gray-400 ml-auto hidden sm:block">
              {filteredVisitors.length} of {visitors.length} visitors
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500 uppercase font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Visitor Profile</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">Company & Reason</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Visiting</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                  
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredVisitors.map((visitor) => (
                  <tr key={visitor.id} className="group hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-100 to-purple-100 text-indigo-600 flex items-center justify-center font-bold text-sm border border-indigo-50">
                          {getInitials(visitor.full_name)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{visitor.full_name}</div>
                          <div className="text-xs text-gray-400">ID: #{visitor.id.toString().padStart(4, '0')}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Phone size={14} className="text-gray-400" />
                          <span>{visitor.phone_number}</span>
                        </div>
                        {visitor.email && (
                          <div className="flex items-center gap-2 text-gray-500 text-xs">
                            <Mail size={14} className="text-gray-400" />
                            <span>{visitor.email}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 font-medium text-gray-700">
                          <Building size={14} className="text-gray-400" />
                          <span>{visitor.company || "Personal"}</span>
                        </div>
                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md w-fit">
                          {visitor.reason}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        visitor.is_active 
                          ? "bg-green-50 text-green-700 border-green-200" 
                          : "bg-gray-50 text-gray-600 border-gray-200"
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${visitor.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        {visitor.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-gray-700">
                      {visitor.visiting_name}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(visitor)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => deleteVisitor(visitor.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {visitors.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <Users size={40} className="text-gray-300" />
                        <p>No visitors found. Add one to get started.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modern Modal */}
      {isModalOpen && editingVisitor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-800">
                {modalMode === "create" ? "Register New Visitor" : "Edit Visitor Details"}
              </h2>
              <button 
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              <form id="visitorForm" onSubmit={handleSubmit} className="space-y-6">
                
                {/* Section 1 */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Users size={14} /> Personal Info
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <InputGroup 
                      label="Full Name" 
                      value={editingVisitor.full_name} 
                      onChange={(e) => handleInputChange("full_name", e.target.value)}
                      icon={<Users size={16} />}
                      maxlength={25}
                      placeholder="Enter full name"
                      required
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <InputGroup 
                        label="Phone" 
                        value={editingVisitor.phone_number} 
                        onChange={(e) => handleInputChange("phone_number", e.target.value.replace(/\D/g, ''))}
                        icon={<Phone size={16} />}
                        maxlength={11}
                        placeholder="0912 345 6789"
                        required
                      />
                      <InputGroup 
                        label="Email (Optional)" 
                        type="email"
                        value={editingVisitor.email} 
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        icon={<Mail size={16} />}
                        maxlength={35}
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2 */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Building size={14} /> Visit Details
                  </h3>
                  <InputGroup 
                    label="Company / Organization" 
                    value={editingVisitor.company} 
                    onChange={(e) => handleInputChange("company", e.target.value)}
                    icon={<Building size={16} />}
                    maxlength={35}
                    placeholder="Enter company or organization"
                   />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason for Visit</label>
                    <textarea
                      value={editingVisitor.reason}
                      onChange={(e) => handleInputChange("reason", e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm resize-none"
                      placeholder="e.g. Interview, Delivery, Meeting..."
                      maxlength={125}
                      required
                    />
                  </div>

                  <InputGroup
                    label="Who is being visited"
                    value={editingVisitor.visiting_name}
                    onChange={(e) => handleInputChange("visiting_name", e.target.value)}
                    icon={<Users size={16} />}
                    maxlength={25}
                    placeholder="Enter name of host or department"
                    required
                  />

                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={editingVisitor.is_active}
                          onChange={(e) => handleInputChange("is_active", e.target.checked)}
                          className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:border-indigo-600 checked:bg-indigo-600"
                        />
                        <div className="pointer-events-none absolute top-2/4 left-2/4 -translate-x-2/4 -translate-y-2/4 text-white opacity-0 transition-opacity peer-checked:opacity-100">
                          <svg stroke="currentColor" fill="none" strokeWidth="3" viewBox="0 0 24 24" height="12" width="12" xmlns="http://www.w3.org/2000/svg"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-700">Mark as Active Visitor</span>
                    </label>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="visitorForm"
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all"
              >
                {modalMode === "create" ? "Register Visitor" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components for cleaner code
function StatCard({ title, value, icon, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-green-50 text-green-600 border-green-100",
    red: "bg-red-50 text-red-600 border-red-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    gray: "bg-gray-100 text-gray-600 border-gray-200",
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-xl border ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function InputGroup({ label, icon, type = "text", ...props }) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative group">
        <div className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
          {icon}
        </div>
        <input
          type={type}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
          {...props}
        />
      </div>
    </div>
  );
}